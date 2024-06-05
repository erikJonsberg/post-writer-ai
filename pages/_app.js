import { UserProvider } from "@auth0/nextjs-auth0/client";
import "../styles/globals.css";
import { Inter, Lora } from "@next/font/google";
import { PostsProvider } from "../context/postsContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);
  return (
    <UserProvider>
      <PostsProvider>
        <main className={`${inter.variable} ${lora.variable} font-body`}>
          {getLayout(<Component {...pageProps} />, pageProps)}
        </main>
      </PostsProvider>
    </UserProvider>
  );
}

export default MyApp;
