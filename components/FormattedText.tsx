import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split text by double asterisks (**)
  // Example: "Hello **World**" -> ["Hello ", "World", ""]
  const parts = text.split('**');

  return (
    <span className={className}>
      {parts.map((part, i) => 
        // Odd indices are the text captured inside **...**
        i % 2 === 1 ? (
          <strong key={i} className="font-bold text-gray-900">{part}</strong>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default FormattedText;