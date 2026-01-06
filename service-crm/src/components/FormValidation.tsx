import { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  custom?: (value: string) => string | null;
};

type FieldErrors = Record<string, string>;

export function useFormValidation<T extends Record<string, any>>(
  rules: Partial<Record<keyof T, ValidationRule>>
) {
  const [errors, setErrors] = useState<FieldErrors>({});

  const validateField = useCallback((field: keyof T, value: string): string | null => {
    const rule = rules[field];
    if (!rule) return null;

    if (rule.required && !value?.trim()) {
      return 'This field is required';
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      return `Must be at least ${rule.minLength} characters`;
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      return `Must be less than ${rule.maxLength} characters`;
    }

    if (value && rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (value && rule.phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
      if (!phoneRegex.test(value)) {
        return 'Please enter a valid phone number';
      }
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      return 'Invalid format';
    }

    if (value && rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const validate = useCallback((data: Partial<T>): boolean => {
    const newErrors: FieldErrors = {};
    let isValid = true;

    for (const field in rules) {
      const error = validateField(field as keyof T, String(data[field] || ''));
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [rules, validateField]);

  const setFieldError = useCallback((field: string, error: string | null) => {
    setErrors(prev => {
      if (error) return { ...prev, [field]: error };
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);

  return { errors, validate, validateField, setFieldError, clearErrors };
}

// Inline error message component
export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="flex items-center gap-1 mt-1 text-xs text-red-600 dark:text-red-400">
      <AlertCircle size={12} />
      {error}
    </p>
  );
}

// Validated input wrapper
type ValidatedInputProps = {
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function ValidatedField({ error, label, required, className = '', children }: ValidatedInputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className={error ? '[&>input]:border-red-500 [&>input]:dark:border-red-500 [&>textarea]:border-red-500 [&>select]:border-red-500' : ''}>
        {children}
      </div>
      <FieldError error={error} />
    </div>
  );
}
