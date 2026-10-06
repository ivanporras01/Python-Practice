import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'PBSC Python Lab | Professor Porras',description:'Learn Python through guided explanations, runnable examples, and practice. Introduction to Programming with Professor Porras at Palm Beach State College.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
