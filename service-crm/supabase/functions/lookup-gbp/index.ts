Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { gbpUrl } = await req.json();

    if (!gbpUrl) {
      throw new Error('Google Business Profile URL is required');
    }

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY') || 'AIzaSyCO0kKndUNlmQi3B5mxy4dblg_8WYcuKuk';

    // Extract place ID from various Google Maps URL formats
    let placeId = '';
    let businessName = '';

    // Try to extract place ID from URL
    // Format: /maps/place/Business+Name/@lat,lng,z/data=...!1s0x...:0x...!
    const placeIdMatch = gbpUrl.match(/!1s([^!]+)/);
    if (placeIdMatch) {
      placeId = placeIdMatch[1];
    }

    // Extract business name from URL
    const placeNameMatch = gbpUrl.match(/place\/([^/@]+)/);
    if (placeNameMatch) {
      businessName = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
    }

    // If we have a place ID, use Places API to get details
    if (placeId) {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,formatted_address,formatted_phone_number,geometry&key=${googleApiKey}`;
      
      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return new Response(JSON.stringify({
          success: true,
          data: {
            businessName: data.result.name || businessName,
            address: data.result.formatted_address || '',
            phone: data.result.formatted_phone_number || '',
            lat: data.result.geometry?.location?.lat,
            lng: data.result.geometry?.location?.lng
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Fallback: try text search with business name
    if (businessName) {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(businessName)}&key=${googleApiKey}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        
        // Get detailed info including phone
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.place_id}&fields=name,formatted_address,formatted_phone_number&key=${googleApiKey}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        return new Response(JSON.stringify({
          success: true,
          data: {
            businessName: detailsData.result?.name || result.name || businessName,
            address: detailsData.result?.formatted_address || result.formatted_address || '',
            phone: detailsData.result?.formatted_phone_number || '',
            lat: result.geometry?.location?.lat,
            lng: result.geometry?.location?.lng
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Return parsed name at minimum
    return new Response(JSON.stringify({
      success: true,
      data: {
        businessName: businessName || '',
        address: '',
        phone: '',
        lat: null,
        lng: null
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: { message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
