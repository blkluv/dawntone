'use client';
import dynamic from 'next/dynamic';
import styles from './page.module.css';

const DawEditor = dynamic(() => import('../components/DawEditor'), { ssr: false });

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>dawntone editor</h1>
        <DawEditor />
      </main>
    </div>
  );
}
