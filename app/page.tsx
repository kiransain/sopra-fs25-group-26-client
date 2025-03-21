"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering
import "@ant-design/v5-patch-for-react-19";
import styles from "@/styles/page.module.css";

export default function Home() {

  return (
    <div className={styles.page}>
      <li>
        Group 26
      </li>
    </div>
  );
}
