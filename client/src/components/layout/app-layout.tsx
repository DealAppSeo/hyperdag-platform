import { ReactNode } from "react";
import { Layout } from "./layout";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function AppLayout({ children, title, description }: AppLayoutProps) {
  return (
    <Layout>
      <div className="py-4 sm:py-6">
        <header className="mb-4 sm:mb-6">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-1 text-sm sm:text-base text-gray-500">{description}</p>
            )}
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </Layout>
  );
}
