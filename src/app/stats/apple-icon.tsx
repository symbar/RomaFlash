import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function StatsAppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#8e1f2f',
          borderRadius: '40px',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="112"
          height="112"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f0b516"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18" />
          <rect x="7" y="12" width="3" height="6" rx="1" fill="#f0b516" />
          <rect x="12" y="8" width="3" height="10" rx="1" fill="#f0b516" />
          <rect x="17" y="4" width="3" height="14" rx="1" fill="#f0b516" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
