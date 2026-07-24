import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function GoogleIcon({ size = 18 }: Readonly<{ size?: number }>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" accessibilityElementsHidden>
      <Path
        fill="#4285f4"
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <Path
        fill="#34a853"
        d="M9 18c2.43 0 4.468-.806 5.956-2.18l-2.909-2.258c-.806.54-1.836.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
      />
      <Path
        fill="#fbbc05"
        d="M3.963 10.707A5.421 5.421 0 0 1 3.682 9c0-.593.102-1.17.281-1.707V4.961H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.039l3.007-2.332Z"
      />
      <Path
        fill="#ea4335"
        d="M9 3.58c1.321 0 2.507.455 3.441 1.346l2.581-2.58C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.961l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"
      />
    </Svg>
  );
}
