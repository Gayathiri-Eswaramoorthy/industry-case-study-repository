import { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

function ImprovedForm({ 
  children, 
  onSubmit, 
  loading = false, 
  submitText = "Submit",
  submitDisabled = false,
  className = ""
}) {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      {children}
      
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || submitDisabled}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Processing...
            </span>
          ) : (
            submitText
          )}
        </button>
      </div>
    </form>
  );
}

// Form Field Components
function FormField({ 
  label, 
  error, 
  required = false, 
  description, 
  children 
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {children}
      
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function TextInput({ 
  error, 
  className = "", 
  ...props 
}) {
  return (
    <input
      type="text"
      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
        error 
          ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300' 
          : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
      } ${className}`}
      {...props}
    />
  );
}

function TextArea({ 
  error, 
  className = "", 
  rows = 4,
  ...props 
}) {
  return (
    <textarea
      rows={rows}
      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical transition-colors ${
        error 
          ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300' 
          : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
      } ${className}`}
      {...props}
    />
  );
}

function SelectInput({ 
  error, 
  children, 
  className = "",
  ...props 
}) {
  return (
    <select
      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
        error 
          ? 'border-red-300 bg-red-50 text-red-900' 
          : 'border-slate-300 bg-white text-slate-900'
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function PasswordInput({ 
  error, 
  className = "",
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          error 
            ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300' 
            : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
        } ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function Checkbox({ 
  error, 
  label, 
  className = "",
  ...props 
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        className={`h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 ${
          error ? 'border-red-300' : ''
        } ${className}`}
        {...props}
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function SuccessMessage({ children }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
      <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
      <p className="text-sm text-emerald-800">{children}</p>
    </div>
  );
}

function ErrorMessage({ children }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
      <p className="text-sm text-red-800">{children}</p>
    </div>
  );
}

export {
  ImprovedForm,
  FormField,
  TextInput,
  TextArea,
  SelectInput,
  PasswordInput,
  Checkbox,
  SuccessMessage,
  ErrorMessage
};
