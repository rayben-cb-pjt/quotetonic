import React, { useEffect } from 'react';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
}

const SEO: React.FC<SEOProps> = ({
    title = 'QuoteTonic - Smart Quotation SaaS',
    description = 'Create professional quotations in seconds with QuoteTonic. The smart SaaS solution for modern businesses.',
    keywords = 'quotation, invoice, estimate, saas, business tools, pdf generator',
    image = '/og-image.png',
    url = 'https://quotetonic.com'
}) => {
    const siteTitle = title === 'QuoteTonic - Smart Quotation SaaS' ? title : `${title} | QuoteTonic`;

    useEffect(() => {
        // Update Title
        document.title = siteTitle;

        // Helper to update meta tags
        const updateMeta = (name: string, content: string, attribute = 'name') => {
            let element = document.querySelector(`meta[${attribute}="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content || '');
        };

        // Helper to update link tags (canonical)
        const updateLink = (rel: string, href: string) => {
            let element = document.querySelector(`link[rel="${rel}"]`);
            if (!element) {
                element = document.createElement('link');
                element.setAttribute('rel', rel);
                document.head.appendChild(element);
            }
            element.setAttribute('href', href);
        };


        // Update Meta Tags
        updateMeta('description', description!);
        updateMeta('keywords', keywords!);
        updateLink('canonical', url);

        // Open Graph
        updateMeta('og:type', 'website', 'property');
        updateMeta('og:url', url, 'property');
        updateMeta('og:title', siteTitle, 'property');
        updateMeta('og:description', description!, 'property');
        updateMeta('og:image', image, 'property');

        // Twitter
        updateMeta('twitter:card', 'summary_large_image', 'property');
        updateMeta('twitter:url', url, 'property');
        updateMeta('twitter:title', siteTitle, 'property');
        updateMeta('twitter:description', description!, 'property');
        updateMeta('twitter:image', image, 'property');

        // JSON-LD
        const jsonLdData = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "QuoteTonic",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "description": description,
            "url": url,
            "publisher": {
                "@type": "Organization",
                "name": "QuoteTonic",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://quotetonic.com/logo.png"
                }
            }
        };

        let script = document.querySelector('script[type="application/ld+json"]');
        if (!script) {
            script = document.createElement('script');
            script.setAttribute('type', 'application/ld+json');
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(jsonLdData);

    }, [siteTitle, description, keywords, image, url]);

    return null;
};

export default SEO;
