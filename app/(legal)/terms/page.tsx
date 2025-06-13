import type { Metadata } from "next";

export const metadata: Metadata = {
    description: "Terms of Service for Argus",
    title: "Terms of Service for Argus",
};

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="mb-4 text-3xl font-bold">Terms of Service</h1>
            <p className="mb-4">
                <strong>v1.0.0 | June, 2025</strong>
            </p>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Overview</h2>
            <p className="mb-4">
                Argus is a unimodal video analysis tool that helps users analyze
                YouTube video content through intelligent text processing. By using Argus, you
                agree to these terms of service.
            </p>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Service Description</h2>

            <h3 className="mt-4 mb-2 text-xl font-bold">Video Analysis Service</h3>
            <ul className="mb-4 list-inside list-disc">
                <li>
                    Argus analyzes publicly available YouTube video transcripts and metadata
                </li>
                <li>
                    We provide AI-powered insights, section breakdowns, and interactive Q&A about video content
                </li>
                <li>
                    All analysis is performed on text content only - we do not process visual or audio data
                </li>
                <li>
                    Service is provided on an "as available" basis without guarantees of uptime
                </li>
            </ul>

            <h3 className="mt-4 mb-2 text-xl font-bold">YouTube Content Integration</h3>
            <ul className="mb-4 list-inside list-disc">
                <li>
                    Argus accesses only publicly available YouTube videos through official APIs
                </li>
                <li>
                    We comply with YouTube's Terms of Service and API usage policies
                </li>
                <li>
                    We are not responsible for changes to YouTube's API or service availability
                </li>
                <li>
                    Users must ensure they have rights to analyze the videos they submit
                </li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Acceptable Use</h2>
            <p className="mb-2">Users agree to:</p>
            <ul className="mb-4 list-inside list-disc">
                <li>Only analyze publicly available YouTube content</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not attempt to reverse engineer or abuse our AI systems</li>
                <li>Not use the service for spam, harassment, or malicious purposes</li>
                <li>Respect intellectual property rights of video creators</li>
                <li>Not attempt to overwhelm our servers with excessive requests</li>
                <li>Use the service for legitimate research, educational, or personal purposes</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Prohibited Activities</h2>
            <p className="mb-2">Users must not:</p>
            <ul className="mb-4 list-inside list-disc">
                <li>Attempt to analyze private, restricted, or copyrighted content without permission</li>
                <li>Use our service to extract content for redistribution or commercial use</li>
                <li>Attempt to bypass rate limits or access controls</li>
                <li>Use automated scripts or bots to abuse the service</li>
                <li>Share or distribute analysis results that violate creators' rights</li>
                <li>Use the service for any illegal or harmful activities</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">AI-Generated Content</h2>
            <p className="mb-2">Regarding our AI analysis features:</p>
            <ul className="mb-4 list-inside list-disc">
                <li>AI responses are generated based on transcript analysis and may contain errors</li>
                <li>Users should verify important information from original video sources</li>
                <li>We do not guarantee the accuracy, completeness, or reliability of AI analysis</li>
                <li>AI-generated insights are for informational purposes only</li>
                <li>Users are responsible for how they use and share AI-generated content</li>
                <li>Our AI models are not trained on your personal usage data</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Data and Privacy</h2>
            <ul className="mb-4 list-inside list-disc">
                <li>Your use of our service is governed by our Privacy Policy</li>
                <li>We process data as described in our Privacy Policy</li>
                <li>We do not store YouTube videos or transcripts permanently</li>
                <li>Analysis is performed in real-time without data retention</li>
                <li>You retain ownership of any questions or queries you submit</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Intellectual Property</h2>
            <ul className="mb-4 list-inside list-disc">
                <li>Argus and its underlying technology are protected by intellectual property rights</li>
                <li>Users retain rights to their original queries and questions</li>
                <li>Video content remains the property of original creators</li>
                <li>AI analysis results are provided for your personal use</li>
                <li>You may not claim ownership of AI-generated insights</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Service Availability</h2>
            <ul className="mb-4 list-inside list-disc">
                <li>We strive to maintain service availability but do not guarantee uptime</li>
                <li>Maintenance and updates may temporarily interrupt service</li>
                <li>We may modify features with reasonable notice to users</li>
                <li>Critical security updates may be deployed without prior notice</li>
                <li>We reserve the right to suspend service for abuse or violations</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Rate Limits and Fair Use</h2>
            <ul className="mb-4 list-inside list-disc">
                <li>We implement rate limits to ensure fair access for all users</li>
                <li>Excessive usage may result in temporary access restrictions</li>
                <li>Commercial usage may require separate agreements</li>
                <li>We reserve the right to adjust limits based on system capacity</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Third-Party Services</h2>
            <ul className="mb-4 list-inside list-disc">
                <li>Our service integrates with YouTube and Google AI services</li>
                <li>Third-party services are governed by their own terms and policies</li>
                <li>We are not responsible for third-party service disruptions</li>
                <li>Changes to third-party APIs may affect our service functionality</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Disclaimer of Warranties</h2>
            <ul className="mb-4 list-inside list-disc">
                <li>Argus is provided "as is" without warranties of any kind</li>
                <li>We do not guarantee uninterrupted, secure, or error-free service</li>
                <li>AI analysis results are provided without warranty of accuracy</li>
                <li>We disclaim all warranties, express or implied, including merchantability</li>
                <li>Users assume all risks associated with using our service</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Limitation of Liability</h2>
            <ul className="mb-4 list-inside list-disc">
                <li>
                    We are not liable for any indirect, incidental, special, or consequential damages
                </li>
                <li>
                    Our total liability is limited to the amount paid for the service (currently $0)
                </li>
                <li>
                    We are not responsible for decisions made based on AI analysis results
                </li>
                <li>
                    Users are solely responsible for how they use and interpret our analysis
                </li>
                <li>
                    We are not liable for content accuracy or availability of analyzed videos
                </li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Termination</h2>
            <ul className="mb-4 list-inside list-disc">
                <li>You may stop using our service at any time</li>
                <li>We may suspend access for violations of these terms</li>
                <li>We may discontinue the service with reasonable notice</li>
                <li>Termination does not affect rights and obligations that arose before termination</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Geographic Restrictions</h2>
            <ul className="mb-4 list-inside list-disc">
                <li>Our service is available globally where legally permitted</li>
                <li>Users are responsible for compliance with local laws</li>
                <li>We reserve the right to restrict access based on geographic location</li>
            </ul>

            <h2 className="mt-6 mb-2 text-2xl font-bold">Changes to Terms</h2>
            <p className="mb-4">
                We may update these terms from time to time. Material changes will be
                communicated through our website. Continued use of our service after
                changes constitutes acceptance of new terms.
            </p>

            <div className="mt-8 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                    <strong>Note:</strong> This is a free service provided for educational and research purposes.
                    We encourage responsible use and respect for content creators' rights.
                </p>
            </div>
        </div>
    );
}