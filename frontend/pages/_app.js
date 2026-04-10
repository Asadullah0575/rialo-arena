import '../styles/globals.css';
import Head from 'next/head';
import { GameProvider } from '../context/GameContext';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return (
    <GameProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
        <meta name="theme-color" content="#0A0A0F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <title>Rialo Arena</title>
      </Head>
      <Component {...pageProps} />
    </GameProvider>
  );
}
