import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export default async function ApiDocPage() {
  const spec = await getApiDocs();
  
  return (
    <main className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">API 接口文档</h1>
        <ReactSwagger spec={spec} />
      </div>
    </main>
  );
}
