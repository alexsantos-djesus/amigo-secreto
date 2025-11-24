// pages/_app.tsx
import "../styles/tailwind-generated.css";
import type { AppProps } from "next/app";
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
