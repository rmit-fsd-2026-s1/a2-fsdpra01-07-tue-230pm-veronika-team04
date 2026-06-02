import "@/styles/globals.css";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return ( 
    <html suppressHydrationWarning>
      <body>
        <ChakraProvider value={defaultSystem}>
          <Component {...pageProps} />
        </ChakraProvider> 
      </body>
    </html>
  );
}
