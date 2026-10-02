import React from "react";

interface KenyanShieldProps {
  className?: string;
}

export const KenyanShield: React.FC<KenyanShieldProps> = ({ className = "h-6 w-6" }) => (
  <svg
    viewBox="0 0 128 206"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M11 1C26 15 32 30 28 45L61 101"
      stroke="#F8FAFC"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M117 1C102 15 96 30 100 45L67 101"
      stroke="#F8FAFC"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path d="M26 47L15 93L26 159C33 180 49 202 64 204C79 202 95 180 102 159L113 93L102 47C89 19 75 10 64 10C53 10 39 19 26 47Z" fill="#D40000" />
    <path d="M61.5 10H66.5V204H61.5V10Z" fill="#F8FAFC" />
    <path d="M49 10C39 44 39 72 49 95C53 83 55 68 55 52C55 36 53 22 49 10Z" fill="#F8FAFC" />
    <path d="M79 10C89 44 89 72 79 95C75 83 73 68 73 52C73 36 75 22 79 10Z" fill="#F8FAFC" />
    <path d="M49 196C39 162 39 134 49 111C53 123 55 138 55 154C55 170 53 184 49 196Z" fill="#F8FAFC" />
    <path d="M79 196C89 162 89 134 79 111C75 123 73 138 73 154C73 170 75 184 79 196Z" fill="#F8FAFC" />
    <ellipse cx="64" cy="103" rx="9" ry="12" fill="#F8FAFC" />
    <path
      d="M27 161L9 203"
      stroke="#F8FAFC"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M101 161L119 203"
      stroke="#F8FAFC"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);
