/**
 * SEO Utility Functions for UNIHIVE
 * Handles dynamic metadata updates and JSON-LD structured data injection.
 * Implemented with fallback options and try-catch blocks for maximum safety.
 */

export interface MetaConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  canonical?: string;
}

/**
 * Updates page title and key search/social meta tags in the document head dynamically.
 */
export function updateMetaTags(config: MetaConfig) {
  try {
    const siteUrl = "https://unihivegh.com";
    const defaultImage = "/icons/icon-192.png";

    // 1. Update document title
    if (config.title) {
      document.title = config.title;
    }

    // Helper to get or create a meta tag
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to get or create a link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Search Meta Tags
    if (config.description) {
      setMetaTag('name', 'description', config.description);
    }
    if (config.keywords) {
      setMetaTag('name', 'keywords', config.keywords);
    }

    // 3. Canonical Link Tag
    if (config.canonical) {
      setLinkTag('canonical', config.canonical);
    } else if (config.title) {
      // Default to current "clean" URL if title is changing but no explicit canonical
      // This strips query parameters and hashes to avoid duplicate indexing of filtered pages
      const cleanUrl = window.location.origin + window.location.pathname;
      setLinkTag('canonical', cleanUrl);
    }

    // 4. Open Graph (Facebook / WhatsApp / etc.)
    const titleVal = config.title || document.title;
    const descVal = config.description || "";
    const imgVal = config.image ? (config.image.startsWith('http') ? config.image : `${siteUrl}${config.image}`) : `${siteUrl}${defaultImage}`;
    const urlVal = config.url || window.location.href;

    setMetaTag('property', 'og:title', titleVal);
    setMetaTag('property', 'og:description', descVal);
    setMetaTag('property', 'og:image', imgVal);
    setMetaTag('property', 'og:url', urlVal);
    setMetaTag('property', 'og:type', 'website');

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', titleVal);
    setMetaTag('name', 'twitter:description', descVal);
    setMetaTag('name', 'twitter:image', imgVal);
  } catch (error) {
    console.error("SEO utility updateMetaTags error (safely caught):", error);
  }
}

/**
 * Injects a JSON-LD structured data script block into the head.
 * Returns a cleanup function that removes the script block when the component unmounts.
 * 
 * @param id Unique identifier for the script tag (prevents duplicates)
 * @param data The schema object
 */
export function injectJsonLd(id: string, data: object): () => void {
  try {
    // Remove existing if any
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(data);
    document.head.appendChild(script);

    // Return cleanup function to run when page unmounts
    return () => {
      try {
        const scriptToRemove = document.getElementById(id);
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      } catch (e) {
        console.warn("Cleanup JSON-LD script failed:", e);
      }
    };
  } catch (error) {
    console.error("SEO utility injectJsonLd error (safely caught):", error);
    return () => {};
  }
}
