import type { Metadata } from "next";

export const metadata: Metadata = {
    description: "Privacy Policy for Argus",
    title: "Privacy Policy for Argus",
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="mb-4 text-3xl font-bold">Privacy Policy</h1>
            <p className="mb-4">
                <strong>v1.0.0 | June, 2025</strong>
            </p>

            <h2 className="mt-6 mb-2 text-2xl font-bold">
                Our Commitment to Privacy
            </h2>
            <p className="mb-4">
                At Argus, we believe that privacy is fundamental to trust.
                Our unimodal video analysis tool is built with privacy at its core, and we're committed to being transparent about how we handle your data.
            </p>
            <p className="mb-4">
                <strong>Note</strong>: Argus is a transcript-focused analysis tool.
                We DO NOT download, store, or cache YouTube videos.
                All analyses are performed on publicly available YouTube transcripts and metadata.
            </p>

            <h2 className="mt-6 mb-2 text-2xl font-bold">
                Verified privacy commitments:
            </h2>
            <ul className="mb-4 list-inside list-disc">
                <li>
                    <strong>Transcript-Only Processing</strong>:
                    We only access publicly available YouTube transcripts and metadata
                </li>
                <li>
                    <strong>No Video Storage</strong>: We never download or store YouTube video files on our servers
                </li>
                <li>
                    <strong>Temporary Processing</strong>: Video data is processed in real-time and not permanently stored
                </li>
                <li>
                    <strong>User Control</strong>: You provide YouTube URLs voluntarily and can stop using the service anytime
                </li>
                <li>
                    <strong>No Personal Video Data</strong>: We only work with public YouTube content that you choose to analyze
                </li>
                <li>
                    <strong>Transparent Analysis</strong>: Our AI analysis is based solely on text content, not visual data
                </li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">
                Youtube Data Integration
            </h2>
            <p className="mb-4">When you use Argus:</p>
            <ul className="mb-4 list-inside list-disc">
                <li>
                    We access only publicly available YouTube video metadata (title, description, duration)
                </li>
                <li>
                    We retrieve publicly available YouTube transcripts when available
                </li>
                <li>We DO NOT access private, unlisted, or restricted YouTube content</li>
                <li>We DO NOT require YouTube account authentication</li>
                <li>
                    Video analysis is performed in real-time without permanent storage
                </li>
                <li>
                    We use YouTube's public APIs in compliance with their Terms of Service
                </li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">
                Data Collection and Usage
            </h2>

            <h3 className="mt-4 mb-2 text-xl font-bold">
                YouTube Content Processing
            </h3>
            <ul className="mb-4 list-inside list-disc">
                <li>
                    We access public video titles, descriptions, and duration information
                </li>
                <li>
                    We only process videos that are publicly accessible on YouTube
                </li>
                <li>
                    We never download actual video files, only text-based content
                </li>
                <li>
                    We retrieve auto-generated or uploaded captions when publicly available
                </li>
                <li>
                    We collect basic usage analytics -- page views, performance metrics and feature usage to
                    improve the tool, but this data is masked
                </li>
            </ul>
            <h3 className="mt-4 mb-2 text-xl font-bold">AI Analysis Data Handling</h3>
            <ul className="mb-4 list-inside list-disc">
                <li>
                    Our AI processes video transcripts to generate intelligent responses
                </li>
                <li>
                    Video content is analyzed in memory and not stored permanently
                </li>
                <li>
                    Your video queries and interactions are NOT used to train AI/ML models
                </li>
                <li>
                    Analysis data is only retained during your active session
                </li>
            </ul>

            <h3 className="mt-4 mb-2 text-xl font-bold">Data We DO NOT Collect</h3>
            <ul className="mb-4 list-inside list-disc">
                <li>
                    Personal identifying information (names, emails, addresses)
                </li>
                <li>
                    Location data or tracking information
                </li>
                <li>User-generated content beyond the YouTube URLs you provide</li>
                <li>Private or restricted video content</li>
                <li>Device information beyond standard web analytics</li>
                <li>YouTube account credentials or authentication data</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">
                Google User Data Handling
            </h2>
            <h3 className="mt-4 mb-2 text-xl font-bold">Security Measures</h3>
            <h4 className="mt-4 mb-2 text-xl font-bold">Technical Security</h4>
            <ul className="mb-4 list-inside list-disc">
                <li>
                    Regular code reviews and security assessments
                </li>
                <li>
                    Eliminating storage reduces security risks
                </li>
                <li>All external API calls are authenticated and encrypted</li>
                <li>
                    All data transmission uses TLS 1.3 encryption
                </li>
            </ul>

            <h3 className="mt-4 mb-2 text-xl font-bold">Infrastructure Security</h3>
            <ul className="mb-4 list-inside list-disc">
                <li>All servers are hosted in SOC 2 and SOC 3 Type II certified data centers</li>
                <li>Strict authentication for any administrative access</li>
                <li>No permanent data means no backup security risks</li>
                <li>
                    24/7 security monitoring and incident response
                </li>
                <li>Encryption at rest for all stored data using AES-256</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">
                Your Rights and Controls
            </h2>
            <h3 className="mt-4 mb-2 text-xl font-bold">User Rights</h3>
            <ul className="mb-4 list-inside list-disc">
                <li>Full transparency about how your data is processed</li>
                <li>Request information about any temporary data processing</li>
                <li>Request immediate deletion of any temporary data</li>
                <li>Limit or stop using our service at any time</li>

            </ul>
            <h3 className="mt-4 mb-2 text-xl font-bold">How to Exercise Your Rights</h3>
            <ul className="mb-4 list-inside list-disc">
                <li>Reach out with any privacy concerns or requests</li>
                <li>Since no account is required, you maintain full control</li>
                <li>Your rights can be exercised immediately without delay</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">
                Legal Compliance
            </h2>
            <h3 className="mt-4 mb-2 text-xl font-bold">
                Regulatory Compliance
            </h3>
            <ul className="mb-4 list-inside list-disc">
                <li>
                Full compliance with European data protection regulations: GDPR
                </li>
                <li>
                Full compliance with YouTube Terms of Service and API policies: Youtube ToS
                </li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Contact</h2>
            <p className="mb-4">For privacy-related concerns, reach out: <u>lesliegyamfi02@gmail.com</u></p>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Policy Updates</h2>
            <p className="mb-4">
                If need be, this privacy policy will be updated from time to time
            </p>
        </div>
    );
}