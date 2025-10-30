import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

interface LinkInfo {
  text: string;
  href: string;
  isInternal: boolean;
}

interface SiteStructure {
  allLinks: string[];
  navigation: LinkInfo[];
  footerLinks: LinkInfo[];
  baseUrl: string;
}

interface DesignSystem {
  extractedCSS: string[];
  computedStyles: any;
  colorPalette: string[];
  fonts: string[];
  favicon: string;
  metaInfo: {
    title: string;
    description: string;
    keywords: string;
    viewport: string;
    charset: string;
  };
  bodyHTML: string;
  headHTML: string;
}

interface PageData {
  url: string;
  relativePath: string;
  title: string;
  bodyContent: string;
  headContent: string;
  mainContent: string;
  breadcrumbs: any[];
  pageNav: any[];
  pathname: string;
  scrapedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('🚀 Starting deep reverse engineering of:', url);

    // Launch browser in non-headless mode for debugging
    const browser = await puppeteer.launch({
      headless: false, // Show browser window for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
  // Navigate to the page
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  // Extra wait to allow dynamic content/links to render
  await new Promise(resolve => setTimeout(resolve, 4000));

    console.log('🔍 Phase 1: Discovering all links and site structure...');
    
    // Phase 1: Discover all internal links
    const siteStructure = await discoverSiteStructure(page, url);
    
    console.log(`📊 Found ${siteStructure.allLinks.length} unique internal links`);
    
    console.log('🎨 Phase 2: Extracting complete design system...');
    
    // Phase 2: Extract complete CSS and design information
    const designSystem = await extractCompleteDesign(page);
    
    console.log('📄 Phase 3: Scraping all pages...');
    
    // Phase 3: Scrape all discovered pages
    const allPagesData = await scrapeAllPages(browser, siteStructure.allLinks, url);
    
    await browser.close();

    const completeData = {
      originalUrl: url,
      siteStructure,
      designSystem,
      pages: allPagesData,
      scrapedAt: new Date().toISOString(),
      totalPages: allPagesData.length
    };

    console.log(`✅ Complete reverse engineering finished! Scraped ${allPagesData.length} pages`);

    return NextResponse.json(completeData);

  } catch (error) {
    console.error('Reverse engineering error:', error);
    return NextResponse.json(
      { error: 'Failed to reverse engineer website', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function discoverSiteStructure(page: any, baseUrl: string): Promise<SiteStructure> {
  return await page.evaluate((baseUrl: string) => {
    const baseHost = new URL(baseUrl).hostname;
    const allLinks = new Set<string>();
    const navigation: LinkInfo[] = [];
    const footerLinks: LinkInfo[] = [];
    
    // Extract all links from multiple sources
    const links = Array.from(document.querySelectorAll('a[href]'));
    
    // Also look for links in buttons with onclick handlers, data attributes, etc.
    const buttonLinks = Array.from(document.querySelectorAll('button[onclick], [data-href], [data-url]'));
    
    [...links, ...buttonLinks].forEach(element => {
      let href: string | null = null;
      
      if (element.tagName.toLowerCase() === 'a') {
        href = element.getAttribute('href');
      } else {
        // For buttons and other elements, check data attributes
        href = element.getAttribute('data-href') || 
               element.getAttribute('data-url') ||
               element.getAttribute('data-link');
        
        // Check onclick handlers for URLs
        const onclick = element.getAttribute('onclick');
        if (onclick && onclick.includes('location.href')) {
          const urlMatch = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
          if (urlMatch) href = urlMatch[1];
        }
      }
      
      if (!href) return;
      
      let fullUrl = href;
      
      // Convert relative URLs to absolute
      if (href.startsWith('/')) {
        fullUrl = new URL(href, baseUrl).href;
      } else if (href.startsWith('#')) {
        return; // Skip anchor links
      } else if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        try {
          fullUrl = new URL(href, baseUrl).href;
        } catch (e) {
          return; // Invalid URL
        }
      }
      
      try {
        const linkUrl = new URL(fullUrl);
        
        // Only include internal links, exclude common file types
        if (linkUrl.hostname === baseHost && 
            !fullUrl.match(/\.(pdf|jpg|jpeg|png|gif|svg|zip|doc|docx|xls|xlsx)(\?|$)/i)) {
          allLinks.add(fullUrl);
        }
      } catch (e) {
        // Invalid URL, skip
      }
    });
    
    // Extract navigation structure
    const navElements = document.querySelectorAll('nav, .nav, .navbar, .navigation, header ul, .menu');
    navElements.forEach(nav => {
      const navLinks = nav.querySelectorAll('a');
      navLinks.forEach(link => {
        if (link.textContent?.trim()) {
          navigation.push({
            text: link.textContent.trim(),
            href: link.href,
            isInternal: link.href.includes(baseHost)
          });
        }
      });
    });
    
    // Extract footer links
    const footerElements = document.querySelectorAll('footer, .footer');
    footerElements.forEach(footer => {
      const footerLinkElements = footer.querySelectorAll('a');
      footerLinkElements.forEach(link => {
        if (link.textContent?.trim()) {
          footerLinks.push({
            text: link.textContent.trim(),
            href: link.href,
            isInternal: link.href.includes(baseHost)
          });
        }
      });
    });
    
    return {
      allLinks: Array.from(allLinks),
      navigation,
      footerLinks,
      baseUrl
    };
  }, baseUrl);
}

async function extractCompleteDesign(page: any): Promise<DesignSystem> {
  return await page.evaluate(() => {
    // Extract all CSS rules
    const extractedCSS: string[] = [];
    
    try {
      // Get all stylesheets
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const styleSheet = document.styleSheets[i];
          if (styleSheet.cssRules) {
            for (let j = 0; j < styleSheet.cssRules.length; j++) {
              try {
                extractedCSS.push(styleSheet.cssRules[j].cssText);
              } catch (e) {
                // Cross-origin CSS, skip
              }
            }
          }
        } catch (e) {
          // Cross-origin CSS, skip
        }
      }
    } catch (e) {
      console.warn('Could not extract CSS rules');
    }
    
    // Extract computed styles for key elements
    const keyElements = document.querySelectorAll('body, header, nav, main, footer, .header, .navbar, .footer, .main, .content');
    const computedStyles: any = {};
    
    keyElements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      const className = element.className || '';
      const key = `${tagName}_${className}_${index}`;
      
      const styles = window.getComputedStyle(element);
      computedStyles[key] = {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        padding: styles.padding,
        margin: styles.margin,
        borderRadius: styles.borderRadius,
        border: styles.border,
        boxShadow: styles.boxShadow,
        display: styles.display,
        flexDirection: styles.flexDirection,
        justifyContent: styles.justifyContent,
        alignItems: styles.alignItems,
        gridTemplateColumns: styles.gridTemplateColumns,
        width: styles.width,
        height: styles.height,
        maxWidth: styles.maxWidth,
        position: styles.position,
        top: styles.top,
        left: styles.left,
        zIndex: styles.zIndex
      };
    });
    
    // Extract color palette
    const colors = new Set<string>();
    const elements = Array.from(document.querySelectorAll('*'));
    
    elements.slice(0, 100).forEach(el => {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      const borderColor = styles.borderColor;
      
      [bgColor, textColor, borderColor].forEach(color => {
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          colors.add(color);
        }
      });
    });
    
    // Extract fonts
    const fonts = new Set<string>();
    elements.slice(0, 50).forEach(el => {
      const fontFamily = window.getComputedStyle(el).fontFamily;
      if (fontFamily) {
        fonts.add(fontFamily);
      }
    });
    
    // Get favicon
    const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]')?.getAttribute('href') || '';
    
    // Get meta information
    const metaInfo = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
      viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
      charset: document.querySelector('meta[charset]')?.getAttribute('charset') || 'utf-8'
    };
    
    return {
      extractedCSS: extractedCSS.slice(0, 1000), // Limit CSS rules
      computedStyles,
      colorPalette: Array.from(colors).slice(0, 20),
      fonts: Array.from(fonts).slice(0, 10),
      favicon,
      metaInfo,
      bodyHTML: document.body.innerHTML, // Get the complete body HTML
      headHTML: document.head.innerHTML  // Get the complete head HTML
    };
  });
}

async function scrapeAllPages(browser: any, urls: string[], baseUrl: string): Promise<PageData[]> {
  const allPagesData: PageData[] = [];
  const maxPages = 50; // Increased limit to get more pages
  
  for (let i = 0; i < Math.min(urls.length, maxPages); i++) {
    const url = urls[i];
    try {
      console.log(`📄 Scraping page ${i + 1}/${Math.min(urls.length, maxPages)}: ${url}`);
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for main content to be visible and non-empty (React hydration)
      try {
        await page.waitForSelector('main, .main, #main, .content, #content, article', { timeout: 15000, visible: true });
        // Wait until the main content is not empty (hydrated)
        await page.waitForFunction(() => {
          const el = document.querySelector('main, .main, #main, .content, #content, article');
          if (!el) return false;
          // Check for non-empty text or child elements
          return (el.textContent && el.textContent.trim().length > 20) || el.children.length > 0;
        }, { timeout: 10000 });
      } catch (e) {
        // If not found or still empty, wait a bit longer for hydration
  await new Promise(resolve => setTimeout(resolve, 2000));
        console.warn(`⚠️ Main content may not be fully hydrated for ${url}`);
      }

      // Extra delay to allow React/Next.js hydration (safety net)
  await new Promise(resolve => setTimeout(resolve, 1000));

      const pageData = await page.evaluate((currentUrl: string, baseUrl: string) => {
        // Extract page-specific content
        const title = document.title;
        const bodyContent = document.body.innerHTML;
        const headContent = document.head.innerHTML;
        
        // Also capture the complete HTML structure
        const fullHTML = document.documentElement.outerHTML;
        
        // Extract specific sections
        const headerContent = document.querySelector('header, .header, .navbar, nav')?.outerHTML || '';
        const footerContent = document.querySelector('footer, .footer')?.outerHTML || '';
        const navContent = document.querySelector('nav, .nav, .navigation, .navbar')?.outerHTML || '';
        
        // Extract body classes and attributes
        const bodyClasses = document.body.className;
        const bodyAttributes = Array.from(document.body.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ');
        
        // Extract main content areas
        const mainContent = document.querySelector('main, .main, .content, #content')?.innerHTML || 
                           document.querySelector('article, .article')?.innerHTML ||
                           document.body.innerHTML;
        
        // Extract breadcrumbs
        const breadcrumbs: any[] = [];
        const breadcrumbElements = document.querySelectorAll('.breadcrumb, .breadcrumbs, nav[aria-label="breadcrumb"]');
        breadcrumbElements.forEach(bc => {
          const links = bc.querySelectorAll('a, span');
          links.forEach(link => {
            if (link.textContent?.trim()) {
              breadcrumbs.push({
                text: link.textContent.trim(),
                href: (link as HTMLAnchorElement).href || ''
              });
            }
          });
        });
        
        // Extract page-specific navigation
        const pageNav: any[] = [];
        const sidebarNavs = document.querySelectorAll('.sidebar nav, .side-nav, .page-nav');
        sidebarNavs.forEach(nav => {
          const links = nav.querySelectorAll('a');
          links.forEach(link => {
            if (link.textContent?.trim()) {
              pageNav.push({
                text: link.textContent.trim(),
                href: link.href
              });
            }
          });
        });
        
        // Create relative path for internal linking
        const urlObj = new URL(currentUrl);
        const relativePath = urlObj.pathname === '/' ? 'index' : urlObj.pathname.replace(/\//g, '_').replace(/\.html?$/, '');
        
        return {
          url: currentUrl,
          relativePath: relativePath,
          title,
          bodyContent,
          headContent,
          mainContent,
          breadcrumbs,
          pageNav,
          pathname: urlObj.pathname,
          fullHTML: fullHTML,
          headerContent,
          footerContent,
          navContent,
          bodyClasses,
          bodyAttributes,
          scrapedAt: new Date().toISOString()
        };
      }, url, baseUrl);
      
      allPagesData.push(pageData);
      await page.close();
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.warn(`Failed to scrape ${url}:`, error);
    }
  }
  
  return allPagesData;
}