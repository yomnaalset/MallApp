import { useState } from 'react';
import { ClipboardCheck, ClipboardCopy, Clock } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { ROLES_ENUM } from '@/lib/constants';

export default function DiscountCodeBanner({ discountCode }) {
  const [copied, setCopied] = useState(false);
  const { role } = useAuth();

  // Only show discount banner for customer users
  if (!discountCode || role !== ROLES_ENUM.CUSTOMER) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(discountCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatExpirationDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `May ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <div className="bg-[#111] text-white rounded-sm mb-6 p-3">
      <h2 className="font-medium text-sm mb-1">
        The Mall Has a Special Discount For You!
      </h2>
      <p className="text-sm mb-1">
        Apply this code to get {discountCode.value}% off your order
      </p>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1 opacity-70" />
          <span className="text-xs opacity-70">
            Expires: {formatExpirationDate(discountCode.expiration_date)}
          </span>
        </div>
        
        <div className="flex items-center">
          <div className="bg-blue-600 text-white font-medium px-3 py-0.5 rounded-l-sm text-sm">
            {discountCode.code}
          </div>
          <button
            onClick={copyToClipboard}
            className="bg-blue-700 hover:bg-blue-800 transition px-1.5 py-0.5 rounded-r-sm"
            aria-label={copied ? "Copied" : "Copy to clipboard"}
          >
            {copied ? (
              <ClipboardCheck className="h-3.5 w-3.5" />
            ) : (
              <ClipboardCopy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 