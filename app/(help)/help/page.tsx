import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Help and Support for Argus",
  title: "Help and Support for Argus",
};

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="mb-4 text-3xl font-bold">Help & Support</h1>

      <div className="mb-8 flex items-center gap-2 text-sm text-gray-600">
        <span>Need help? We're here for you</span>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 text-center">
        <h2 className="mb-4 text-xl font-semibold text-blue-800">
          Get in Touch
        </h2>
        <p className="mb-6 text-blue-700">
          Have questions, feedback, or need assistance with Argus? We'd love to
          hear from you!
        </p>

        <div className="mb-4">
          <a
            href="mailto:lesliegyamfi02@gmail.com"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <span className="text-lg">📧</span>
            Send us an email
          </a>
        </div>
      </div>

      <div className="mt-8 space-y-4 text-gray-600">
        <h3 className="text-lg font-semibold text-gray-800">
          What can we help with?
        </h3>
        <ul className="space-y-2 list-disc list-inside">
          <li>Technical issues or bugs</li>
          <li>Questions about video analysis</li>
          <li>Feature requests or suggestions</li>
          <li>General feedback about Argus</li>
        </ul>
      </div>

      <div className="mt-8 rounded-lg  p-4">
        <p className="text-sm text-gray-600">
          <strong>Response Time:</strong> We typically respond within 24-48
          hours. Thanks for your patience!
        </p>
      </div>
    </div>
  );
}
