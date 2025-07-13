import * as React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Yahnu Logo"
    {...props}
  >
    <path
      d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="hsl(var(--primary) / 0.1)"
    />
    <path
      d="M2 7L12 12L22 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12V22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 4.5L7 9.5"
      stroke="hsl(var(--accent))"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
