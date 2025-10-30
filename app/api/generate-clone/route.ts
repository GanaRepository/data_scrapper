// import { NextRequest, NextResponse } from 'next/server';
// import fs from 'fs';
// import path from 'path';

// export async function POST(request: NextRequest) {
//   try {
//     const { scrapedData, originalUrl } = await request.json();
    
//     if (!scrapedData) {
//       return NextResponse.json({ error: 'Scraped data is required' }, { status: 400 });
//     }

//     // Generate unique ID for this clone
//     const cloneId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
//     // Create directory for the clone
//     const cloneDir = path.join(process.cwd(), 'public', 'clones', cloneId);
//     fs.mkdirSync(cloneDir, { recursive: true });

//     console.log(`🏗️ Generating complete website replica with ${scrapedData.pages?.length || 0} pages...`);

//     // Generate complete CSS from extracted styles
//     const cssContent = generateCompleteCSS(scrapedData.designSystem);
    
//     // Generate all HTML pages
//     if (scrapedData.pages && scrapedData.pages.length > 0) {
//       scrapedData.pages.forEach((pageData: any, index: number) => {
//         // Use full HTML structure if available, otherwise fall back to generated HTML
//         let htmlContent;
//         if (pageData.fullHTML) {
//           htmlContent = generateFromFullHTML(pageData, scrapedData, originalUrl);
//         } else {
//           htmlContent = generatePageHTML(pageData, scrapedData, originalUrl, index === 0);
//         }
        
//         // Create proper file names and paths
//         let fileName;
//         if (index === 0) {
//           fileName = 'index.html';
//         } else {
//           // Clean up the relative path to create a valid file name
//           const cleanPath = pageData.relativePath || pageData.url?.split('/').pop() || `page${index}`;
//           fileName = `${cleanPath.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`;
//         }
        
//         // Fix internal links to point to local HTML files
//         htmlContent = fixInternalLinks(htmlContent, scrapedData.pages, originalUrl);
        
//         fs.writeFileSync(path.join(cloneDir, fileName), htmlContent);
//         console.log(`📄 Generated: ${fileName}`);
//       });
//     } else {
//       // Fallback: generate basic HTML if no pages data
//       const htmlContent = generateBasicHTML(scrapedData, originalUrl);
//       fs.writeFileSync(path.join(cloneDir, 'index.html'), htmlContent);
//     }
    
//     // Write CSS and data files
//     fs.writeFileSync(path.join(cloneDir, 'style.css'), cssContent);
//     fs.writeFileSync(path.join(cloneDir, 'data.json'), JSON.stringify(scrapedData, null, 2));
    
//     // Create a site map page for easy navigation
//     const sitemapContent = generateSitemapPage(scrapedData, originalUrl);
//     fs.writeFileSync(path.join(cloneDir, 'sitemap.html'), sitemapContent);

//     // Save clone metadata
//     const cloneInfo = {
//       id: cloneId,
//       originalUrl,
//       title: scrapedData.title || 'Untitled Clone',
//       createdAt: new Date().toISOString(),
//       productCount: scrapedData.products?.length || 0,
//       websiteType: scrapedData.websiteType || 'general'
//     };

//     // Save to clones index
//     const clonesIndexPath = path.join(process.cwd(), 'public', 'clones', 'index.json');
//     let clonesIndex = [];
    
//     if (fs.existsSync(clonesIndexPath)) {
//       try {
//         clonesIndex = JSON.parse(fs.readFileSync(clonesIndexPath, 'utf8'));
//       } catch (e) {
//         console.warn('Could not read clones index');
//       }
//     }
    
//     clonesIndex.push(cloneInfo);
//     fs.writeFileSync(clonesIndexPath, JSON.stringify(clonesIndex, null, 2));

//     console.log(`✅ Clone generated with ID: ${cloneId}`);

//     return NextResponse.json(cloneInfo);

//   } catch (error) {
//     console.error('Clone generation error:', error);
//     return NextResponse.json(
//       { error: 'Failed to generate clone', details: error instanceof Error ? error.message : 'Unknown error' },
//       { status: 500 }
//     );
//   }
// }

// function generateCompleteCSS(designSystem: any) {
//   if (!designSystem) return generateBasicCSS();
  
//   let css = `/* Clone-specific styles - minimal interference with original CSS */\n\n`;
  
//   // Only add essential clone-specific styles to avoid breaking original layout
//   css += `
// /* Essential resets to preserve original structure */
// html, body {
//   margin: 0 !important;
//   padding: 0 !important;
// }

// /* Ensure images work properly */
// img {
//   max-width: 100%;
//   height: auto;
// }

// /* Fix any broken absolute URLs in CSS */
// `;
  
//   // Don't override computed styles - let original CSS handle structure
  
//   // Add responsive design and additional styling
//   css += `
// /* Enhanced Styling for Clone */
// * {
//   box-sizing: border-box;
// }

// body {
//   margin: 0;
//   padding: 0;
// }

// img {
//   max-width: 100%;
//   height: auto;
// }

// a {
//   color: inherit;
//   text-decoration: none;
// }

// a:hover {
//   opacity: 0.8;
// }

// /* Responsive Design */
// @media (max-width: 768px) {
//   body {
//     font-size: 14px;
//   }
  
//   .container {
//     padding: 10px;
//   }
// }

// /* Clone Notice Styling */
// .clone-notice {
//   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//   color: white;
//   padding: 10px;
//   text-align: center;
//   font-size: 12px;
//   position: sticky;
//   top: 0;
//   z-index: 10000;
// }

// .clone-notice a {
//   color: #fbbf24;
//   text-decoration: underline;
// }

// /* Enhanced Modal and Close Button Styling */
// [class*="close"], 
// [class*="modal-close"], 
// [aria-label*="close" i],
// [title*="close" i],
// .btn-close,
// .close-btn {
//   cursor: pointer !important;
//   opacity: 1 !important;
//   visibility: visible !important;
//   pointer-events: auto !important;
//   z-index: 999999 !important;
//   position: relative !important;
// }

// [class*="close"]:hover, 
// [class*="modal-close"]:hover, 
// [aria-label*="close" i]:hover,
// [title*="close" i]:hover,
// .btn-close:hover,
// .close-btn:hover {
//   opacity: 0.7 !important;
//   transform: scale(1.1) !important;
//   transition: all 0.2s ease !important;
// }

// /* Ensure modals are properly positioned and closeable */
// [class*="modal"],
// [class*="popup"], 
// [class*="overlay"],
// [role="dialog"] {
//   pointer-events: auto !important;
// }

// /* Force visibility of close buttons */
// [class*="modal"] [class*="close"],
// [class*="popup"] [class*="close"],
// [class*="overlay"] [class*="close"],
// [role="dialog"] [class*="close"] {
//   display: block !important;
//   opacity: 1 !important;
//   visibility: visible !important;
// }
// `;

//   return css;
// }

// function fixInternalLinks(htmlContent: string, allPages: any[], originalUrl: string): string {
//   const baseUrl = new URL(originalUrl).origin;
  
//   // Create a mapping of original URLs to local HTML files
//   const urlMapping: Record<string, string> = {};
  
//   allPages.forEach((page, index) => {
//     const originalPageUrl = page.url;
//     let localFileName;
    
//     if (index === 0) {
//       localFileName = 'index.html';
//     } else {
//       const cleanPath = page.relativePath || page.url?.split('/').pop() || `page${index}`;
//       localFileName = `${cleanPath.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`;
//     }
    
//     urlMapping[originalPageUrl] = localFileName;
    
//     // Also map relative paths
//     const urlObj = new URL(originalPageUrl);
//     urlMapping[urlObj.pathname] = localFileName;
//   });
  
//   // Replace all internal links
//   let fixedContent = htmlContent;
  
//   // Fix href attributes
//   fixedContent = fixedContent.replace(
//     /href=["']([^"']*?)["']/g,
//     (match, url) => {
//       // Skip external links, mailto, tel, etc.
//       if (url.startsWith('http') && !url.startsWith(baseUrl)) {
//         return match;
//       }
//       if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
//         return match;
//       }
      
//       // Convert to absolute URL for mapping
//       let absoluteUrl;
//       try {
//         if (url.startsWith('/')) {
//           absoluteUrl = baseUrl + url;
//         } else if (url.startsWith(baseUrl)) {
//           absoluteUrl = url;
//         } else {
//           absoluteUrl = new URL(url, originalUrl).href;
//         }
        
//         // Check if we have a local file for this URL
//         if (urlMapping[absoluteUrl]) {
//           return `href="${urlMapping[absoluteUrl]}"`;
//         }
//         if (urlMapping[url]) {
//           return `href="${urlMapping[url]}"`;
//         }
//       } catch (e) {
//         // Invalid URL, keep original
//         return match;
//       }
      
//       return match;
//     }
//   );
  
//   return fixedContent;
// }

// function generateSitemapPage(scrapedData: any, originalUrl: string): string {
//   const pages = scrapedData.pages || [];
//   const baseUrl = new URL(originalUrl).origin;
  
//   const pageLinks = pages.map((page: any, index: number) => {
//     let fileName;
//     if (index === 0) {
//       fileName = 'index.html';
//     } else {
//       const cleanPath = page.relativePath || page.url?.split('/').pop() || `page${index}`;
//       fileName = `${cleanPath.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`;
//     }
    
//     return `
//       <tr>
//         <td><a href="${fileName}">${page.title || fileName}</a></td>
//         <td><a href="${page.url}" target="_blank">Original</a></td>
//         <td>${new URL(page.url).pathname}</td>
//       </tr>
//     `;
//   }).join('');
  
//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Site Map - Cloned from ${baseUrl}</title>
//     <style>
//         body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
//         .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
//         h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 10px; }
//         table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//         th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
//         th { background-color: #007acc; color: white; }
//         a { color: #007acc; text-decoration: none; }
//         a:hover { text-decoration: underline; }
//         .stats { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
//         .back-link { display: inline-block; margin-bottom: 20px; padding: 10px 20px; background: #007acc; color: white; border-radius: 5px; }
//     </style>
// </head>
// <body>
//     <div class="container">
//         <a href="index.html" class="back-link">← Back to Home</a>
        
//         <h1>🗺️ Site Map</h1>
        
//         <div class="stats">
//             <strong>Cloned from:</strong> <a href="${originalUrl}" target="_blank">${originalUrl}</a><br>
//             <strong>Total Pages:</strong> ${pages.length}<br>
//             <strong>Generated:</strong> ${new Date().toLocaleString()}
//         </div>
        
//         <table>
//             <thead>
//                 <tr>
//                     <th>Page Title / Local File</th>
//                     <th>Original URL</th>
//                     <th>Path</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 ${pageLinks}
//             </tbody>
//         </table>
        
//         <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
//             <p>This sitemap shows all pages that were scraped and cloned from the original website.</p>
//             <p>Click on any local file name to view the cloned page, or "Original" to see the source.</p>
//         </div>
//     </div>
// </body>
// </html>`;
// }

// function generateFromFullHTML(pageData: any, fullSiteData: any, originalUrl: string) {
//   let fullHTML = pageData.fullHTML;
  
//   // Fix relative URLs to absolute URLs
//   const baseUrl = new URL(originalUrl);
  
//   // Enhance HTML with proper header/nav/footer if missing
//   if (pageData.headerContent && !fullHTML.includes(pageData.headerContent.substring(0, 50))) {
//     // Insert header after body opening tag
//     fullHTML = fullHTML.replace(
//       /(<body[^>]*>)/i,
//       `$1\n${pageData.headerContent}`
//     );
//   }
  
//   if (pageData.footerContent && !fullHTML.includes(pageData.footerContent.substring(0, 50))) {
//     // Insert footer before body closing tag but after our scripts
//     fullHTML = fullHTML.replace(
//       /(<\/body>)/i,
//       `${pageData.footerContent}\n$1`
//     );
//   }
  
//   // If navigation is separate from header, ensure it's included
//   if (pageData.navContent && pageData.navContent !== pageData.headerContent && 
//       !fullHTML.includes(pageData.navContent.substring(0, 50))) {
//     fullHTML = fullHTML.replace(
//       /(<body[^>]*>)/i,
//       `$1\n${pageData.navContent}`
//     );
//   }
  
//   // Fix CSS links
//   fullHTML = fullHTML.replace(
//     /<link([^>]*?)href=["']([^"']*?)["']([^>]*?)>/gi,
//     (match: string, before: string, href: string, after: string) => {
//       if (href.startsWith('/')) {
//         href = baseUrl.origin + href;
//       } else if (!href.startsWith('http') && !href.startsWith('data:')) {
//         href = new URL(href, originalUrl).href;
//       }
//       return `<link${before}href="${href}"${after}>`;
//     }
//   );
  
//   // Fix image sources
//   fullHTML = fullHTML.replace(
//     /<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi,
//     (match: string, before: string, src: string, after: string) => {
//       if (src.startsWith('/')) {
//         src = baseUrl.origin + src;
//       } else if (!src.startsWith('http') && !src.startsWith('data:')) {
//         src = new URL(src, originalUrl).href;
//       }
//       return `<img${before}src="${src}"${after}>`;
//     }
//   );
  
//   // Don't remove all scripts - keep essential ones but remove tracking/analytics
//   fullHTML = fullHTML.replace(/<script[^>]*>(.*?google-analytics.*?|.*?gtm.*?|.*?facebook.*?|.*?twitter.*?)<\/script>/gi, '');
  
//   // MINIMAL INTERVENTION: Only fix critical visibility issues
//   const criticalCSS = `
//     <style>
//       /* MINIMAL FIXES - Preserve animations and spacing */
      
//       /* Only fix elements that are explicitly hidden */
//       [style*="display: none"]:not([data-preserve-hide]),
//       [style*="display:none"]:not([data-preserve-hide]) {
//         display: block !important;
//       }
      
//       [style*="visibility: hidden"]:not([data-preserve-hide]),
//       [style*="visibility:hidden"]:not([data-preserve-hide]) {
//         visibility: visible !important;
//       }
      
//       /* Only fix zero opacity if it's clearly meant to hide content */
//       [style*="opacity: 0"]:not([style*="transition"]):not([style*="animation"]),
//       [style*="opacity:0"]:not([style*="transition"]):not([style*="animation"]) {
//         opacity: 1 !important;
//       }
      
//       /* Fix only accessibility hiding classes, preserve others */
//       .sr-only:not(.sr-only-focusable) {
//         position: static !important;
//         width: auto !important;
//         height: auto !important;
//         padding: 0 !important;
//         margin: 0 !important;
//         overflow: visible !important;
//         clip: auto !important;
//         white-space: normal !important;
//       }
      
//       /* Ensure body overflow is not completely hidden */
//       body[style*="overflow: hidden"] {
//         overflow: auto !important;
//       }
      
//       /* Fix elements positioned far off-screen (accessibility hacks) */
//       [style*="left: -9999px"], [style*="left:-9999px"],
//       [style*="top: -9999px"], [style*="top:-9999px"],
//       [style*="text-indent: -9999"], [style*="text-indent:-9999"] {
//         position: static !important;
//         left: auto !important;
//         top: auto !important;
//         text-indent: 0 !important;
//       }
      
//       /* Make sure main content containers are visible */
//       main:not([style*="display"]),
//       .main:not([style*="display"]),
//       #main:not([style*="display"]),
//       .content:not([style*="display"]),
//       #content:not([style*="display"]) {
//         display: block !important;
//       }
      
//       /* Fix lazy-loaded images that are stuck */
//       img[data-src]:not([src]) {
//         opacity: 1 !important;
//       }
      
//       /* Preserve all animations, transitions, and transforms */
//       /* This is key - we DON'T override these anymore */
//     </style>
//   `;
  
//   // Insert critical CSS into head
//   fullHTML = fullHTML.replace('</head>', `${criticalCSS}</head>`);
  
//   // Add clone notice and popup killer
//   const cloneNotice = `
//     <!-- SMART VISIBILITY FIXER - Preserve layout, fix visibility -->
//     <script>
//         (function() {
//             console.log('� SMART MODE: Fixing visibility while preserving layout');
            
//             function smartVisibilityFix() {
//                 // STEP 1: Remove popups and overlays first
//                 document.querySelectorAll('[role="dialog"], [aria-modal="true"], .popup-overlay, .jsx-e776502b7fe00e26').forEach(el => {
//                     console.log('Removing popup:', el);
//                     el.remove();
//                 });
                
//                 // STEP 2: Very selective inline style fixes (preserve animations/transitions)
//                 document.querySelectorAll('*').forEach(el => {
//                     const style = el.getAttribute('style');
//                     if (style) {
//                         // Only fix obvious hiding styles, preserve everything else
//                         let newStyle = style;
                        
//                         // Only fix display:none if there's no transition/animation
//                         if (/display\s*:\s*none/gi.test(style) && 
//                             !/transition|animation/gi.test(style)) {
//                             newStyle = newStyle.replace(/display\s*:\s*none/gi, 'display: block');
//                         }
                        
//                         // Only fix visibility:hidden if there's no transition/animation
//                         if (/visibility\s*:\s*hidden/gi.test(style) && 
//                             !/transition|animation/gi.test(style)) {
//                             newStyle = newStyle.replace(/visibility\s*:\s*hidden/gi, 'visibility: visible');
//                         }
                        
//                         // Only fix accessibility-style positioning
//                         if (/left\s*:\s*-9999px/gi.test(style)) {
//                             newStyle = newStyle.replace(/left\s*:\s*-9999px/gi, 'left: auto');
//                         }
//                         if (/top\s*:\s*-9999px/gi.test(style)) {
//                             newStyle = newStyle.replace(/top\s*:\s*-9999px/gi, 'top: auto');
//                         }
                        
//                         // DO NOT touch opacity, transforms, or other animation properties
                        
//                         if (newStyle !== style) {
//                             el.setAttribute('style', newStyle);
//                         }
//                     }
                    
//                     // Remove only accessibility-specific hiding classes
//                     const accessibilityHidingClasses = ['sr-only', 'screen-reader-only', 'visually-hidden'];
//                     accessibilityHidingClasses.forEach(cls => {
//                         if (el.classList.contains(cls) && !el.classList.contains('sr-only-focusable')) {
//                             el.classList.remove(cls);
//                         }
//                     });
                    
//                     // DO NOT remove classes like 'hidden', 'opacity-0', etc. as they might be part of animations
//                 });
                
//                 // STEP 3: Ensure body overflow is not hidden
//                 document.body.style.overflow = 'auto';
//                 document.documentElement.style.overflow = 'auto';
                
//                 // STEP 4: Force visibility on main content areas without changing layout
//                 const contentSelectors = ['main', '.main', '#main', '.content', '#content', 'article', '.post-content'];
//                 contentSelectors.forEach(selector => {
//                     try {
//                         document.querySelectorAll(selector).forEach(el => {
//                             el.style.visibility = 'visible';
//                             el.style.opacity = '1';
//                         });
//                     } catch(e) {}
//                 });
                
//                 // STEP 5: Fix lazy-loaded images
//                 document.querySelectorAll('img[data-src]').forEach(img => {
//                     if (img.dataset.src && !img.src) {
//                         img.src = img.dataset.src;
//                     }
//                     img.style.opacity = '1';
//                 });
                
//                 console.log('✅ Smart visibility fix complete - layout preserved!');
//             }
            
//             // Run immediately
//             smartVisibilityFix();
            
//             // Run on DOM ready
//             if (document.readyState === 'loading') {
//                 document.addEventListener('DOMContentLoaded', smartVisibilityFix);
//             }
            
//             // Run after load with short delays
//             window.addEventListener('load', () => {
//                 setTimeout(smartVisibilityFix, 100);
//                 setTimeout(smartVisibilityFix, 500);
//             });
            
//             // Keep checking for dynamic content every few seconds
//             setInterval(smartVisibilityFix, 5000);
//         })();
//     </script>
    
//     <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; text-align: center; font-size: 12px; position: sticky; top: 0; z-index: 10000;">
//         🔄 Cloned from <a href="${originalUrl}" target="_blank" style="color: #fbbf24;">${originalUrl}</a>
//         | <button onclick="document.querySelectorAll('*').forEach(el => { const s = getComputedStyle(el); if(s.position==='fixed'&&parseInt(s.zIndex)>50) el.remove(); })" style="background:red;border:none;color:white;padding:4px 8px;border-radius:3px;cursor:pointer;margin-left:10px;">🚀 NUKE POPUPS</button>
//     </div>
//   `;
  
//   // Insert clone notice after body tag
//   fullHTML = fullHTML.replace(/<body([^>]*)>/i, `<body$1>${cloneNotice}`);
  
//   return fullHTML;
// }

// function generatePageHTML(pageData: any, fullSiteData: any, originalUrl: string, isHomePage: boolean = false) {
//   // Use the full HTML if available for better structure preservation
//   if (pageData.fullHTML) {
//     return generateFromFullHTML(pageData, fullSiteData, originalUrl);
//   }
  
//   const { title, bodyContent, headContent } = pageData;
//   const { siteStructure, designSystem } = fullSiteData;
  
//   // Process and clean the head content to preserve CSS links
//   let processedHeadContent = headContent || '';
  
//   // Keep original stylesheets but make them absolute URLs
//   processedHeadContent = processedHeadContent.replace(
//     /<link([^>]*?)href=["']([^"']*?)["']([^>]*?)>/gi,
//     (match: string, before: string, href: string, after: string) => {
//       if (href.startsWith('/')) {
//         const baseUrl = new URL(originalUrl);
//         href = baseUrl.origin + href;
//       } else if (!href.startsWith('http')) {
//         href = new URL(href, originalUrl).href;
//       }
//       return `<link${before}href="${href}"${after}>`;
//     }
//   );
  
//   // Process internal links to point to cloned pages
//   let processedBodyContent = bodyContent;
  
//   if (siteStructure && siteStructure.allLinks) {
//     siteStructure.allLinks.forEach((link: string, index: number) => {
//       const urlObj = new URL(link);
//       const relativePath = urlObj.pathname === '/' ? 'index.html' : `${urlObj.pathname.replace(/\//g, '_').replace(/\.html?$/, '')}.html`;
      
//       // Replace internal links
//       processedBodyContent = processedBodyContent.replace(
//         new RegExp(link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
//         relativePath
//       );
//     });
//   }
  
//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="utf-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>${title || 'Cloned Page'}</title>
    
//     <!-- Original head content with preserved CSS -->
//     ${processedHeadContent.replace(/<script[^>]*>.*?<\/script>/gi, '')}
    
//     <!-- Additional extracted styles -->
//     <style>
//         ${designSystem?.extractedCSS ? designSystem.extractedCSS.join('\n') : ''}
//     </style>
    
//     <!-- Our clone-specific styles -->
//     <link rel="stylesheet" href="style.css">
//     ${designSystem?.favicon ? `<link rel="icon" href="${designSystem.favicon}">` : ''}
// </head>
// <body>
//     <!-- IMMEDIATE POPUP KILLER SCRIPT -->
//     <script>
//         // NUCLEAR OPTION - Kill all popups immediately
//         (function() {
//             function nukeAllPopups() {
//                 // Remove ALL fixed/absolute positioned elements with high z-index
//                 const allElements = document.querySelectorAll('*');
//                 allElements.forEach(el => {
//                     const styles = window.getComputedStyle(el);
//                     const zIndex = parseInt(styles.zIndex) || 0;
                    
//                     if ((styles.position === 'fixed' || styles.position === 'absolute') && 
//                         (zIndex > 50 || styles.display === 'flex' || styles.display === 'block')) {
                        
//                         // Additional checks for modal-like elements
//                         const rect = el.getBoundingClientRect();
//                         if (rect.width > 200 && rect.height > 100) {
//                             console.log('REMOVING POPUP:', el);
//                             el.remove();
//                         }
//                     }
//                 });
                
//                 // Remove by common popup selectors
//                 const popupSelectors = [
//                     '[class*="modal" i]',
//                     '[class*="popup" i]',
//                     '[class*="overlay" i]',
//                     '[class*="dialog" i]',
//                     '[role="dialog"]',
//                     '[aria-modal="true"]',
//                     '.swal2-container',
//                     '.sweet-alert',
//                     '.fancybox-container',
//                     '.lightbox',
//                     '[id*="modal" i]',
//                     '[id*="popup" i]'
//                 ];
                
//                 popupSelectors.forEach(selector => {
//                     try {
//                         const elements = document.querySelectorAll(selector);
//                         elements.forEach(el => el.remove());
//                     } catch(e) {
//                         // Ignore selector errors
//                     }
//                 });
                
//                 console.log('🚀 POPUP NUKE COMPLETE!');
//             }
            
//             // Run immediately
//             nukeAllPopups();
            
//             // Run again after DOM is ready
//             if (document.readyState === 'loading') {
//                 document.addEventListener('DOMContentLoaded', nukeAllPopups);
//             }
            
//             // Run again after everything loads
//             window.addEventListener('load', function() {
//                 setTimeout(nukeAllPopups, 100);
//                 setTimeout(nukeAllPopups, 500);
//                 setTimeout(nukeAllPopups, 1000);
//             });
            
//             // Keep watching for new popups
//             const observer = new MutationObserver(function(mutations) {
//                 mutations.forEach(function(mutation) {
//                     mutation.addedNodes.forEach(function(node) {
//                         if (node.nodeType === 1) { // Element node
//                             const styles = window.getComputedStyle(node);
//                             const zIndex = parseInt(styles.zIndex) || 0;
                            
//                             if ((styles.position === 'fixed' || styles.position === 'absolute') && zIndex > 50) {
//                                 console.log('NEW POPUP DETECTED AND REMOVED:', node);
//                                 node.remove();
//                             }
//                         }
//                     });
//                 });
//             });
            
//             observer.observe(document.body, {
//                 childList: true,
//                 subtree: true
//             });
//         })();
//     </script>

//     <!-- Clone Notice -->
//     <div class="clone-notice">
//         🔄 This is a cloned page from <a href="${originalUrl}" target="_blank">${originalUrl}</a>
//         | <a href="index.html">Home</a>
//         | <button onclick="nukeEverything()" style="background:red;border:none;color:white;padding:4px 8px;border-radius:3px;cursor:pointer;margin-left:10px;font-weight:bold;">🚀 NUKE POPUPS</button>
//         | Generated on ${new Date().toLocaleDateString()}
//     </div>

//     <!-- Original page content -->
//     ${processedBodyContent}

//     <!-- Clone Footer -->
//     <div style="background: #1f2937; color: white; padding: 20px; text-align: center; margin-top: 50px;">
//         <p><small>🚀 This is a cloned version of the original website</small></p>
//         <p><small>Original: <a href="${originalUrl}" target="_blank" style="color: #60a5fa;">${originalUrl}</a></small></p>
//     </div>

//     <script>
//         // Enhanced interactivity for cloned website
//         document.addEventListener('DOMContentLoaded', function() {
//             // Update all internal links to work within the clone
//             const links = document.querySelectorAll('a[href]');
//             links.forEach(link => {
//                 const href = link.getAttribute('href');
//                 if (href && href.startsWith('/') && !href.includes('.')) {
//                     // Convert internal paths to HTML files
//                     const newHref = href === '/' ? 'index.html' : href.replace(/\//g, '_') + '.html';
//                     link.setAttribute('href', newHref);
//                 }
//             });
            
//             // Handle modal closing functionality
//             function setupModalClosing() {
//                 // Find all potential close buttons
//                 const closeButtons = document.querySelectorAll([
//                     '[class*="close"]',
//                     '[class*="modal-close"]', 
//                     '[aria-label*="close" i]',
//                     '[title*="close" i]',
//                     'button[type="button"]',
//                     '.btn-close',
//                     '.close-btn',
//                     '[data-dismiss]',
//                     '[data-close]'
//                 ].join(','));
                
//                 closeButtons.forEach(button => {
//                     button.style.cursor = 'pointer';
//                     button.addEventListener('click', function(e) {
//                         e.preventDefault();
//                         e.stopPropagation();
                        
//                         // Find the closest modal/popup/overlay
//                         let modal = this.closest([
//                             '[class*="modal"]',
//                             '[class*="popup"]', 
//                             '[class*="overlay"]',
//                             '[class*="dialog"]',
//                             '[role="dialog"]',
//                             '[aria-modal="true"]'
//                         ].join(','));
                        
//                         if (!modal) {
//                             // Try to find parent with high z-index (likely a modal)
//                             let parent = this.parentElement;
//                             while (parent && parent !== document.body) {
//                                 const styles = window.getComputedStyle(parent);
//                                 if (parseInt(styles.zIndex) > 100 || 
//                                     styles.position === 'fixed' || 
//                                     styles.position === 'absolute') {
//                                     modal = parent;
//                                     break;
//                                 }
//                                 parent = parent.parentElement;
//                             }
//                         }
                        
//                         if (modal) {
//                             modal.style.display = 'none';
//                             modal.remove(); // Completely remove it
//                         }
//                     });
//                 });
                
//                 // Also handle clicking outside modal to close
//                 document.addEventListener('click', function(e) {
//                     const modals = document.querySelectorAll([
//                         '[class*="modal"]',
//                         '[class*="popup"]', 
//                         '[class*="overlay"]',
//                         '[role="dialog"]'
//                     ].join(','));
                    
//                     modals.forEach(modal => {
//                         const styles = window.getComputedStyle(modal);
//                         if (styles.display !== 'none' && !modal.contains(e.target)) {
//                             // Check if clicked on the overlay background
//                             const rect = modal.getBoundingClientRect();
//                             if (e.clientX < rect.left || e.clientX > rect.right ||
//                                 e.clientY < rect.top || e.clientY > rect.bottom) {
//                                 modal.style.display = 'none';
//                             }
//                         }
//                     });
//                 });
                
//                 // Handle ESC key to close modals
//                 document.addEventListener('keydown', function(e) {
//                     if (e.key === 'Escape') {
//                         const visibleModals = document.querySelectorAll([
//                             '[class*="modal"]',
//                             '[class*="popup"]', 
//                             '[class*="overlay"]',
//                             '[role="dialog"]'
//                         ].join(','));
                        
//                         visibleModals.forEach(modal => {
//                             const styles = window.getComputedStyle(modal);
//                             if (styles.display !== 'none') {
//                                 modal.style.display = 'none';
//                             }
//                         });
//                     }
//                 });
//             }
            
//             // Initialize modal closing after a short delay
//             setTimeout(setupModalClosing, 500);
            
//             // Handle form submissions (prevent actual submission)
//             const forms = document.querySelectorAll('form');
//             forms.forEach(form => {
//                 form.addEventListener('submit', function(e) {
//                     e.preventDefault();
//                     alert('This is a cloned website. Form submissions are disabled.');
//                 });
//             });
            
//             // Handle button clicks that might trigger modals/popups
//             const buttons = document.querySelectorAll('button, [role="button"]');
//             buttons.forEach(button => {
//                 if (!button.getAttribute('data-clone-handled')) {
//                     button.setAttribute('data-clone-handled', 'true');
//                     button.addEventListener('click', function(e) {
//                         // If this button would normally open a modal, handle it gracefully
//                         console.log('Button clicked in cloned site:', this.textContent || this.innerHTML);
//                     });
//                 }
//             });
            
//             // Add click tracking for links
//             links.forEach(link => {
//                 link.addEventListener('click', function(e) {
//                     console.log('Link clicked:', this.href);
//                 });
//             });
            
//             // Additional cleanup for any problematic elements
//             setTimeout(() => {
//                 // Remove any elements that might cause issues
//                 const problematicSelectors = [
//                     'script[src*="analytics"]',
//                     'script[src*="gtag"]',
//                     'script[src*="facebook"]',
//                     'script[src*="twitter"]',
//                     '[class*="chat"]',
//                     '[id*="chat"]'
//                 ];
                
//                 problematicSelectors.forEach(selector => {
//                     const elements = document.querySelectorAll(selector);
//                     elements.forEach(el => el.remove());
//                 });
//             }, 1000);
//         });
        
//         // NUCLEAR OPTION - Global function to destroy everything
//         window.nukeEverything = function() {
//             // Remove EVERYTHING with position fixed/absolute
//             const allElements = document.querySelectorAll('*');
//             let removed = 0;
            
//             allElements.forEach(el => {
//                 const styles = window.getComputedStyle(el);
//                 const zIndex = parseInt(styles.zIndex) || 0;
                
//                 if ((styles.position === 'fixed' || styles.position === 'absolute') && 
//                     zIndex > 10 && 
//                     !el.classList.contains('clone-notice')) {
//                     el.remove();
//                     removed++;
//                 }
//             });
            
//             // Also remove by innerHTML content (for admission popups)
//             const suspiciousElements = document.querySelectorAll('*');
//             suspiciousElements.forEach(el => {
//                 const text = el.textContent || '';
//                 if (text.includes('Admission') || 
//                     text.includes('Apply') || 
//                     text.includes('Click to') ||
//                     text.includes('Session 2026')) {
//                     const styles = window.getComputedStyle(el);
//                     if (styles.position === 'fixed' || styles.position === 'absolute' || styles.zIndex > 50) {
//                         el.remove();
//                         removed++;
//                     }
//                 }
//             });
            
//             alert(\`💥 NUKED \${removed} ELEMENTS! Popup should be gone now.\`);
//             console.log(\`💥 NUKED \${removed} ELEMENTS!\`);
//         };

//         // Global function to force close all modals
//         window.forceCloseAllModals = function() {
//             // Remove all fixed position elements with high z-index
//             const allElements = document.querySelectorAll('*');
//             allElements.forEach(el => {
//                 const styles = window.getComputedStyle(el);
//                 if (styles.position === 'fixed' && parseInt(styles.zIndex) > 100) {
//                     el.remove();
//                 }
//             });
            
//             // Also remove common modal classes
//             const modalSelectors = [
//                 '[class*="modal"]',
//                 '[class*="popup"]', 
//                 '[class*="overlay"]',
//                 '[role="dialog"]',
//                 '[aria-modal="true"]'
//             ];
            
//             modalSelectors.forEach(selector => {
//                 const elements = document.querySelectorAll(selector);
//                 elements.forEach(el => {
//                     const styles = window.getComputedStyle(el);
//                     if (styles.display !== 'none') {
//                         el.remove();
//                     }
//                 });
//             });
            
//             console.log('All modals forcefully closed!');
//         };

//         // Force close any persistent modals after page load
//         window.addEventListener('load', function() {
//             setTimeout(() => {
//                 // One more attempt to close any stubborn modals
//                 const allModals = document.querySelectorAll('*');
//                 allModals.forEach(el => {
//                     const styles = window.getComputedStyle(el);
//                     if (styles.position === 'fixed' && 
//                         parseInt(styles.zIndex) > 1000 &&
//                         (styles.display === 'flex' || styles.display === 'block')) {
                        
//                         // Check if it looks like a modal
//                         const rect = el.getBoundingClientRect();
//                         if (rect.width > window.innerWidth * 0.3 && 
//                             rect.height > window.innerHeight * 0.3) {
//                             // Add a close button if none exists
//                             if (!el.querySelector('[class*="close"], .btn-close, [aria-label*="close"]')) {
//                                 const closeBtn = document.createElement('button');
//                                 closeBtn.innerHTML = '✕';
//                                 closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;background:none;border:none;font-size:20px;cursor:pointer;z-index:999999;color:#666;';
//                                 closeBtn.onclick = () => el.remove();
//                                 el.style.position = 'relative';
//                                 el.appendChild(closeBtn);
//                             }
//                         }
//                     }
//                 });
//             }, 2000);
//         });
//     </script>
// </body>
// </html>`;
// }

// function generateBasicHTML(scrapedData: any, originalUrl: string) {
//   // Fallback for when full page data isn't available
//   return generateCloneHTML(scrapedData, originalUrl);
// }

// function generateBasicCSS() {
//   return `/* Basic CSS for clone */
// * {
//   box-sizing: border-box;
//   margin: 0;
//   padding: 0;
// }

// body {
//   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
//   line-height: 1.6;
//   color: #333;
// }

// .clone-notice {
//   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//   color: white;
//   padding: 10px;
//   text-align: center;
//   font-size: 12px;
// }

// .clone-notice a {
//   color: #fbbf24;
//   text-decoration: underline;
// }
// `;
// }

// function generateCloneHTML(scrapedData: any, originalUrl: string) {
//   const { title, products = [], navigation = [], websiteType } = scrapedData;
  
//   // Generate navigation HTML
//   const navHTML = navigation.length > 0 ? `
//     <nav class="navbar">
//       <div class="nav-container">
//         <div class="nav-brand">
//           <h1>${title || 'Cloned Website'}</h1>
//         </div>
//         <ul class="nav-menu">
//           ${navigation.map((item: any) => `
//             <li class="nav-item">
//               <a href="${item.href}" class="nav-link" ${item.isExternal ? 'target="_blank"' : ''}>${item.text}</a>
//             </li>
//           `).join('')}
//         </ul>
//       </div>
//     </nav>
//   ` : '';

//   // Generate products HTML based on website type
//   let productsHTML = '';
  
//   if (products.length > 0) {
//     if (websiteType === 'ecommerce') {
//       productsHTML = `
//         <div class="products-section">
//           <div class="container">
//             <h2 class="section-title">Our Products</h2>
//             <div class="products-grid">
//               ${products.map((product: any) => `
//                 <div class="product-card">
//                   ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title || 'Product'}" class="product-image" onerror="this.style.display='none'">` : ''}
//                   <div class="product-info">
//                     <h3 class="product-title">${product.title || 'Untitled Product'}</h3>
//                     ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
//                     <div class="product-price">
//                       ${product.currentPrice ? `<span class="current-price">${product.currentPrice}</span>` : ''}
//                       ${product.originalPrice && product.originalPrice !== product.currentPrice ? `<span class="original-price">${product.originalPrice}</span>` : ''}
//                     </div>
//                     ${product.productUrl ? `<a href="${product.productUrl}" class="product-link" target="_blank">View Original</a>` : ''}
//                   </div>
//                 </div>
//               `).join('')}
//             </div>
//           </div>
//         </div>
//       `;
//     } else {
//       // Generic content layout
//       productsHTML = `
//         <div class="content-section">
//           <div class="container">
//             <h2 class="section-title">Content</h2>
//             <div class="content-grid">
//               ${products.map((item: any) => `
//                 <div class="content-card">
//                   ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title || 'Content'}" class="content-image" onerror="this.style.display='none'">` : ''}
//                   <div class="content-info">
//                     <h3 class="content-title">${item.title || 'Untitled'}</h3>
//                     ${item.description ? `<p class="content-description">${item.description}</p>` : ''}
//                     ${item.productUrl ? `<a href="${item.productUrl}" class="content-link" target="_blank">Read More</a>` : ''}
//                   </div>
//                 </div>
//               `).join('')}
//             </div>
//           </div>
//         </div>
//       `;
//     }
//   }

//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>${title || 'Cloned Website'}</title>
//     <link rel="stylesheet" href="style.css">
//     <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
// </head>
// <body>
//     <div class="clone-header">
//         <div class="container">
//             <p class="clone-notice">
//                 🔄 This is a clone of <a href="${originalUrl}" target="_blank">${originalUrl}</a>
//                 <span class="clone-timestamp">Generated on ${new Date().toLocaleDateString()}</span>
//             </p>
//         </div>
//     </div>

//     ${navHTML}

//     <main class="main-content">
//         <div class="hero-section">
//             <div class="container">
//                 <h1 class="hero-title">${title || 'Welcome to the Cloned Website'}</h1>
//                 <p class="hero-subtitle">This is a locally generated clone of the original website</p>
//             </div>
//         </div>

//         ${productsHTML}
//     </main>

//     <footer class="footer">
//         <div class="container">
//             <p>&copy; ${new Date().getFullYear()} Website Clone - Generated by Data Scraper</p>
//             <p><small>Original content from: <a href="${originalUrl}" target="_blank">${originalUrl}</a></small></p>
//         </div>
//     </footer>

//     <script>
//         // Add some interactivity
//         document.addEventListener('DOMContentLoaded', function() {
//             // Add click effects to cards
//             const cards = document.querySelectorAll('.product-card, .content-card');
//             cards.forEach(card => {
//                 card.addEventListener('click', function() {
//                     this.style.transform = 'scale(0.98)';
//                     setTimeout(() => {
//                         this.style.transform = 'scale(1)';
//                     }, 150);
//                 });
//             });

//             // Add search functionality if there are products
//             const products = ${JSON.stringify(products)};
//             if (products.length > 0) {
//                 addSearchFunctionality(products);
//             }
//         });

//         function addSearchFunctionality(products) {
//             const container = document.querySelector('.products-grid, .content-grid');
//             if (!container) return;

//             const searchContainer = document.createElement('div');
//             searchContainer.className = 'search-container';
//             searchContainer.innerHTML = \`
//                 <input type="text" id="searchInput" placeholder="Search products..." class="search-input">
//                 <div class="search-results-count"></div>
//             \`;

//             container.parentNode.insertBefore(searchContainer, container);

//             const searchInput = document.getElementById('searchInput');
//             const resultsCount = document.querySelector('.search-results-count');
//             const cards = Array.from(container.children);

//             searchInput.addEventListener('input', function() {
//                 const query = this.value.toLowerCase();
//                 let visibleCount = 0;

//                 cards.forEach(card => {
//                     const text = card.textContent.toLowerCase();
//                     if (text.includes(query)) {
//                         card.style.display = 'block';
//                         visibleCount++;
//                     } else {
//                         card.style.display = 'none';
//                     }
//                 });

//                 resultsCount.textContent = query ? \`Showing \${visibleCount} of \${cards.length} items\` : '';
//             });
//         }
//     </script>
// </body>
// </html>`;
// }

// function generateCloneCSS(scrapedData: any) {
//   const { colors = [], websiteType } = scrapedData;
  
//   // Extract primary colors or use defaults
//   const primaryColor = colors.find((c: string) => c.includes('rgb')) || '#3b82f6';
//   const secondaryColor = colors[1] || '#64748b';
  
//   return `/* Generated CSS for cloned website */
// * {
//     margin: 0;
//     padding: 0;
//     box-sizing: border-box;
// }

// body {
//     font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
//     line-height: 1.6;
//     color: #1f2937;
//     background-color: #f9fafb;
// }

// .container {
//     max-width: 1200px;
//     margin: 0 auto;
//     padding: 0 20px;
// }

// /* Clone Header */
// .clone-header {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     color: white;
//     padding: 8px 0;
//     font-size: 14px;
// }

// .clone-notice {
//     text-align: center;
//     opacity: 0.9;
// }

// .clone-notice a {
//     color: #fbbf24;
//     text-decoration: none;
// }

// .clone-timestamp {
//     margin-left: 10px;
//     opacity: 0.7;
// }

// /* Navigation */
// .navbar {
//     background: white;
//     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
//     position: sticky;
//     top: 0;
//     z-index: 100;
// }

// .nav-container {
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     padding: 1rem 0;
// }

// .nav-brand h1 {
//     color: ${primaryColor};
//     font-size: 1.5rem;
//     font-weight: 700;
// }

// .nav-menu {
//     display: flex;
//     list-style: none;
//     gap: 2rem;
// }

// .nav-link {
//     text-decoration: none;
//     color: #64748b;
//     font-weight: 500;
//     transition: color 0.3s ease;
// }

// .nav-link:hover {
//     color: ${primaryColor};
// }

// /* Main Content */
// .main-content {
//     padding: 2rem 0;
// }

// /* Hero Section */
// .hero-section {
//     background: linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}15 100%);
//     padding: 4rem 0;
//     text-align: center;
//     margin-bottom: 3rem;
// }

// .hero-title {
//     font-size: 3rem;
//     font-weight: 700;
//     margin-bottom: 1rem;
//     color: #1f2937;
// }

// .hero-subtitle {
//     font-size: 1.2rem;
//     color: #64748b;
//     max-width: 600px;
//     margin: 0 auto;
// }

// /* Products/Content Grid */
// .products-section, .content-section {
//     padding: 2rem 0;
// }

// .section-title {
//     font-size: 2.5rem;
//     font-weight: 700;
//     text-align: center;
//     margin-bottom: 3rem;
//     color: #1f2937;
// }

// .products-grid, .content-grid {
//     display: grid;
//     grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
//     gap: 2rem;
//     margin-top: 2rem;
// }

// .product-card, .content-card {
//     background: white;
//     border-radius: 12px;
//     overflow: hidden;
//     box-shadow: 0 4px 6px rgba(0,0,0,0.05);
//     transition: all 0.3s ease;
//     cursor: pointer;
// }

// .product-card:hover, .content-card:hover {
//     transform: translateY(-4px);
//     box-shadow: 0 12px 24px rgba(0,0,0,0.1);
// }

// .product-image, .content-image {
//     width: 100%;
//     height: 200px;
//     object-fit: cover;
//     border-bottom: 1px solid #e5e7eb;
// }

// .product-info, .content-info {
//     padding: 1.5rem;
// }

// .product-title, .content-title {
//     font-size: 1.25rem;
//     font-weight: 600;
//     margin-bottom: 0.5rem;
//     color: #1f2937;
//     line-height: 1.4;
// }

// .product-description, .content-description {
//     color: #64748b;
//     font-size: 0.95rem;
//     margin-bottom: 1rem;
//     line-height: 1.5;
// }

// .product-price {
//     margin-bottom: 1rem;
// }

// .current-price {
//     font-size: 1.5rem;
//     font-weight: 700;
//     color: #059669;
// }

// .original-price {
//     font-size: 1rem;
//     color: #9ca3af;
//     text-decoration: line-through;
//     margin-left: 0.5rem;
// }

// .product-link, .content-link {
//     display: inline-block;
//     background: ${primaryColor};
//     color: white;
//     padding: 0.75rem 1.5rem;
//     text-decoration: none;
//     border-radius: 6px;
//     font-weight: 500;
//     transition: background-color 0.3s ease;
// }

// .product-link:hover, .content-link:hover {
//     background: ${primaryColor}dd;
// }

// /* Search Functionality */
// .search-container {
//     margin-bottom: 2rem;
//     text-align: center;
// }

// .search-input {
//     width: 100%;
//     max-width: 400px;
//     padding: 12px 16px;
//     border: 2px solid #e5e7eb;
//     border-radius: 8px;
//     font-size: 16px;
//     transition: border-color 0.3s ease;
// }

// .search-input:focus {
//     outline: none;
//     border-color: ${primaryColor};
// }

// .search-results-count {
//     margin-top: 10px;
//     color: #64748b;
//     font-size: 14px;
// }

// /* Footer */
// .footer {
//     background: #1f2937;
//     color: white;
//     padding: 2rem 0;
//     margin-top: 4rem;
//     text-align: center;
// }

// .footer a {
//     color: #60a5fa;
//     text-decoration: none;
// }

// .footer a:hover {
//     text-decoration: underline;
// }

// /* Responsive Design */
// @media (max-width: 768px) {
//     .hero-title {
//         font-size: 2rem;
//     }
    
//     .hero-subtitle {
//         font-size: 1rem;
//     }
    
//     .nav-container {
//         flex-direction: column;
//         gap: 1rem;
//     }
    
//     .nav-menu {
//         flex-wrap: wrap;
//         justify-content: center;
//         gap: 1rem;
//     }
    
//     .products-grid, .content-grid {
//         grid-template-columns: 1fr;
//     }
    
//     .section-title {
//         font-size: 2rem;
//     }
// }

// @media (max-width: 480px) {
//     .container {
//         padding: 0 15px;
//     }
    
//     .hero-section {
//         padding: 2rem 0;
//     }
    
//     .hero-title {
//         font-size: 1.75rem;
//     }
// }

// /* Loading Animation */
// @keyframes shimmer {
//     0% { background-position: -468px 0; }
//     100% { background-position: 468px 0; }
// }

// .loading {
//     animation: shimmer 1.5s ease-in-out infinite;
//     background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
//     background-size: 1000px 100%;
// }
// `;
// }

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { scrapedData, originalUrl } = await request.json();
    
    if (!scrapedData) {
      return NextResponse.json({ error: 'Scraped data is required' }, { status: 400 });
    }

    // Generate unique ID for this clone
    const cloneId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Create directory for the clone
    const cloneDir = path.join(process.cwd(), 'public', 'clones', cloneId);
    fs.mkdirSync(cloneDir, { recursive: true });

    console.log(`🏗️ Generating complete website replica with ${scrapedData.pages?.length || 0} pages...`);

    // Generate complete CSS from extracted styles
    const cssContent = generateCompleteCSS(scrapedData.designSystem);
    
    // Generate all HTML pages
    if (scrapedData.pages && scrapedData.pages.length > 0) {
      scrapedData.pages.forEach((pageData: any, index: number) => {
        // Use full HTML structure if available, otherwise fall back to generated HTML
        let htmlContent;
        if (pageData.fullHTML && pageData.fullHTML.length > 100) {
          htmlContent = generateFromFullHTML(pageData, scrapedData, originalUrl);
        } else {
          htmlContent = generatePageHTML(pageData, scrapedData, originalUrl, index === 0);
        }
        
        // Create proper file names and paths
        let fileName;
        if (index === 0) {
          fileName = 'index.html';
        } else {
          // Clean up the relative path to create a valid file name
          const cleanPath = pageData.relativePath || pageData.url?.split('/').pop() || `page${index}`;
          fileName = `${cleanPath.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`;
        }
        
        // Fix internal links to point to local HTML files
        htmlContent = fixInternalLinks(htmlContent, scrapedData.pages, originalUrl);
        
        fs.writeFileSync(path.join(cloneDir, fileName), htmlContent);
        console.log(`📄 Generated: ${fileName}`);
      });
    } else {
      // Fallback: generate basic HTML if no pages data
      const htmlContent = generateBasicHTML(scrapedData, originalUrl);
      fs.writeFileSync(path.join(cloneDir, 'index.html'), htmlContent);
    }
    
    // Write CSS and data files
    fs.writeFileSync(path.join(cloneDir, 'style.css'), cssContent);
    fs.writeFileSync(path.join(cloneDir, 'data.json'), JSON.stringify(scrapedData, null, 2));
    
    // Create a site map page for easy navigation
    const sitemapContent = generateSitemapPage(scrapedData, originalUrl);
    fs.writeFileSync(path.join(cloneDir, 'sitemap.html'), sitemapContent);

    // Save clone metadata
    const cloneInfo = {
      id: cloneId,
      originalUrl,
      title: scrapedData.pages?.[0]?.title || 'Untitled Clone',
      createdAt: new Date().toISOString(),
      pageCount: scrapedData.pages?.length || 0,
      totalLinks: scrapedData.siteStructure?.allLinks?.length || 0
    };

    // Save to clones index
    const clonesIndexPath = path.join(process.cwd(), 'public', 'clones', 'index.json');
    let clonesIndex = [];
    
    if (fs.existsSync(clonesIndexPath)) {
      try {
        clonesIndex = JSON.parse(fs.readFileSync(clonesIndexPath, 'utf8'));
      } catch (e) {
        console.warn('Could not read clones index');
      }
    }
    
    clonesIndex.push(cloneInfo);
    fs.writeFileSync(clonesIndexPath, JSON.stringify(clonesIndex, null, 2));

    console.log(`✅ Clone generated with ID: ${cloneId}`);

    return NextResponse.json(cloneInfo);

  } catch (error) {
    console.error('Clone generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate clone', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateCompleteCSS(designSystem: any) {
  let css = `/* Generated CSS for Website Clone */\n\n`;
  
  // Basic reset and setup
  css += `
* {
  box-sizing: border-box;
}

html, body {
  margin: 0 !important;
  padding: 0 !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

img {
  max-width: 100%;
  height: auto;
}

a {
  color: inherit;
  text-decoration: none;
}

a:hover {
  opacity: 0.8;
}

/* Clone Notice Banner */
.clone-notice-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px;
  text-align: center;
  font-size: 14px;
  position: sticky;
  top: 0;
  z-index: 999999;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.clone-notice-banner a {
  color: #fbbf24;
  text-decoration: underline;
  font-weight: bold;
}

.clone-notice-banner button {
  background: #ef4444;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 15px;
  font-weight: bold;
  font-size: 12px;
}

.clone-notice-banner button:hover {
  background: #dc2626;
}

/* Ensure content is visible */
body > * {
  opacity: 1 !important;
  visibility: visible !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  body {
    font-size: 14px;
  }
  
  .container {
    padding: 10px;
  }
}
`;

  // Add extracted CSS if available
  if (designSystem && designSystem.extractedCSS && Array.isArray(designSystem.extractedCSS)) {
    css += `\n/* Original Website CSS */\n`;
    designSystem.extractedCSS.forEach((rule: string) => {
      if (rule && typeof rule === 'string') {
        css += rule + '\n';
      }
    });
  }

  return css;
}

function generateFromFullHTML(pageData: any, fullSiteData: any, originalUrl: string) {
  let fullHTML = pageData.fullHTML || '';
  
  if (!fullHTML || fullHTML.length < 100) {
    // Fallback to generating HTML if fullHTML is empty
    return generatePageHTML(pageData, fullSiteData, originalUrl, true);
  }
  
  const baseUrl = new URL(originalUrl);
  
  // Fix CSS links to absolute URLs - FIXED REGEX (no lookbehind)
  fullHTML = fullHTML.replace(
    /<link([^>]*?)href=["']([^"']*?)["']([^>]*?)>/gi,
    (match: string, before: string, href: string, after: string) => {
      if (href.startsWith('/')) {
        href = baseUrl.origin + href;
      } else if (!href.startsWith('http') && !href.startsWith('data:')) {
        try {
          href = new URL(href, originalUrl).href;
        } catch (e) {
          // Keep original if URL parsing fails
        }
      }
      return `<link${before}href="${href}"${after}>`;
    }
  );
  
  // Fix image sources - FIXED REGEX (no lookbehind)
  fullHTML = fullHTML.replace(
    /<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi,
    (match: string, before: string, src: string, after: string) => {
      if (src.startsWith('/')) {
        src = baseUrl.origin + src;
      } else if (!src.startsWith('http') && !src.startsWith('data:')) {
        try {
          src = new URL(src, originalUrl).href;
        } catch (e) {
          // Keep original if URL parsing fails
        }
      }
      return `<img${before}src="${src}"${after}>`;
    }
  );
  
  // Fix script sources - FIXED REGEX (no lookbehind)
  fullHTML = fullHTML.replace(
    /<script([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi,
    (match: string, before: string, src: string, after: string) => {
      if (src.startsWith('/')) {
        src = baseUrl.origin + src;
      } else if (!src.startsWith('http')) {
        try {
          src = new URL(src, originalUrl).href;
        } catch (e) {
          // Keep original if URL parsing fails
        }
      }
      return `<script${before}src="${src}"${after}>`;
    }
  );
  
  // Remove tracking scripts - FIXED REGEX (no lookbehind)
  fullHTML = fullHTML.replace(
    /<script[^>]*>[\s\S]*?(google-analytics|gtag|facebook|fbevents|twitter|analytics)[\s\S]*?<\/script>/gi,
    ''
  );
  
  // Add local stylesheet
  fullHTML = fullHTML.replace(
    '</head>',
    '<link rel="stylesheet" href="style.css">\n</head>'
  );
  
  // Add clone notice banner and visibility fix script
  const cloneNotice = `
    <div class="clone-notice-banner">
      🔄 Cloned from <a href="${originalUrl}" target="_blank">${originalUrl}</a>
      <button onclick="window.location.href='sitemap.html'">📑 View Sitemap</button>
      <button onclick="document.querySelectorAll('[style*=fixed]').forEach(function(el) {var z = parseInt(getComputedStyle(el).zIndex); if(z > 100) el.remove();})">🚫 Remove Popups</button>
    </div>
    <script>
      // Force content visibility
      (function() {
        function makeContentVisible() {
          // Remove any overlays with high z-index
          document.querySelectorAll('*').forEach(function(el) {
            var style = window.getComputedStyle(el);
            var zIndex = parseInt(style.zIndex);
            var position = style.position;
            
            if ((position === 'fixed' || position === 'absolute') && zIndex > 9000) {
              var rect = el.getBoundingClientRect();
              if (rect.width > window.innerWidth * 0.8 || rect.height > window.innerHeight * 0.8) {
                el.style.display = 'none';
              }
            }
          });
          
          // Force visibility on all elements
          var allElements = document.querySelectorAll('body *');
          allElements.forEach(function(el) {
            if (el.offsetHeight === 0 || el.offsetWidth === 0) {
              var computed = window.getComputedStyle(el);
              if (computed.display === 'none' && el.textContent.trim().length > 0) {
                el.style.display = 'block';
              }
            }
          });
        }
        
        // Run multiple times to catch dynamic content
        makeContentVisible();
        setTimeout(makeContentVisible, 100);
        setTimeout(makeContentVisible, 500);
        setTimeout(makeContentVisible, 1000);
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', makeContentVisible);
        }
        window.addEventListener('load', function() {
          makeContentVisible();
          setTimeout(makeContentVisible, 200);
        });
      })();
    </script>
  `;
  
  fullHTML = fullHTML.replace(/(<body[^>]*>)/i, `$1${cloneNotice}`);
  
  return fullHTML;
}

function generatePageHTML(pageData: any, fullSiteData: any, originalUrl: string, isHomePage: boolean = false) {
  const title = pageData.title || 'Cloned Page';
  const baseUrl = new URL(originalUrl);
  
  // Use mainContent if available, otherwise use bodyContent
  let content = pageData.mainContent || pageData.bodyContent || '';
  
  // If content is empty, try to extract from fullHTML
  if (!content && pageData.fullHTML) {
    const mainMatch = pageData.fullHTML.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const articleMatch = pageData.fullHTML.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const bodyMatch = pageData.fullHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    
    content = (mainMatch && mainMatch[1]) || (articleMatch && articleMatch[1]) || (bodyMatch && bodyMatch[1]) || pageData.fullHTML;
  }
  
  // Fix relative image and link URLs in content - FIXED REGEX (no lookbehind)
  content = content.replace(
    /src=["']([^"']*?)["']/gi,
    (match: string, src: string) => {
      if (src.startsWith('/')) {
        src = baseUrl.origin + src;
      } else if (!src.startsWith('http') && !src.startsWith('data:')) {
        try {
          src = new URL(src, originalUrl).href;
        } catch (e) {
          // Keep original
        }
      }
      return `src="${src}"`;
    }
  );
  
  // Get navigation from page or site structure
  let navHTML = '';
  if (pageData.navContent) {
    navHTML = pageData.navContent;
  } else if (fullSiteData.siteStructure && fullSiteData.siteStructure.navigation) {
    navHTML = `
      <nav style="background: #2563eb; color: white; padding: 15px;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; gap: 20px; flex-wrap: wrap;">
          ${fullSiteData.siteStructure.navigation.slice(0, 10).map((link: any) => 
            `<a href="${link.href}" style="color: white; text-decoration: none; padding: 8px 12px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">${link.text || 'Link'}</a>`
          ).join('')}
        </div>
      </nav>
    `;
  }
  
  // Get footer from page or generate
  let footerHTML = pageData.footerContent || `
    <footer style="background: #1f2937; color: white; padding: 40px 20px; margin-top: 60px;">
      <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
        <p>&copy; ${new Date().getFullYear()} - Cloned from <a href="${originalUrl}" target="_blank" style="color: #60a5fa;">${originalUrl}</a></p>
        <p style="font-size: 14px; opacity: 0.8; margin-top: 10px;">Generated by Website Cloner</p>
      </div>
    </footer>
  `;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="style.css">
    ${pageData.headContent || ''}
</head>
<body>
    <div class="clone-notice-banner">
      🔄 Cloned from <a href="${originalUrl}" target="_blank">${originalUrl}</a>
      <button onclick="window.location.href='sitemap.html'">📑 View Sitemap</button>
      <button onclick="document.querySelectorAll('[style*=fixed]').forEach(function(el) {var z = parseInt(getComputedStyle(el).zIndex); if(z > 100) el.remove();})">🚫 Remove Popups</button>
    </div>
    
    ${navHTML}
    
    <main style="min-height: 60vh; padding: 20px;">
      ${content}
    </main>
    
    ${footerHTML}
    
    <script>
      // Force content visibility
      (function() {
        function makeContentVisible() {
          document.querySelectorAll('body *').forEach(function(el) {
            if (el.offsetHeight === 0 || el.offsetWidth === 0) {
              var computed = window.getComputedStyle(el);
              if (computed.display === 'none' && el.textContent.trim().length > 20) {
                el.style.display = 'block';
              }
            }
          });
        }
        
        makeContentVisible();
        setTimeout(makeContentVisible, 100);
        setTimeout(makeContentVisible, 500);
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', makeContentVisible);
        }
        window.addEventListener('load', function() {
          makeContentVisible();
          setTimeout(makeContentVisible, 200);
        });
      })();
    </script>
</body>
</html>`;
}

function generateBasicHTML(scrapedData: any, originalUrl: string) {
  const title = scrapedData.designSystem?.metaInfo?.title || 'Cloned Website';
  const bodyHTML = scrapedData.designSystem?.bodyHTML || '<p>No content available</p>';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="clone-notice-banner">
      🔄 Cloned from <a href="${originalUrl}" target="_blank">${originalUrl}</a>
    </div>
    
    ${bodyHTML}
    
    <footer style="background: #1f2937; color: white; padding: 40px 20px; margin-top: 60px; text-align: center;">
      <p>&copy; ${new Date().getFullYear()} - Cloned from <a href="${originalUrl}" target="_blank" style="color: #60a5fa;">${originalUrl}</a></p>
    </footer>
</body>
</html>`;
}

function fixInternalLinks(htmlContent: string, allPages: any[], originalUrl: string): string {
  const baseUrl = new URL(originalUrl).origin;
  
  // Create a mapping of original URLs to local HTML files
  const urlMapping: Record<string, string> = {};
  
  allPages.forEach((page, index) => {
    const originalPageUrl = page.url;
    let localFileName;
    
    if (index === 0) {
      localFileName = 'index.html';
    } else {
      const cleanPath = page.relativePath || page.url?.split('/').pop() || `page${index}`;
      localFileName = `${cleanPath.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`;
    }
    
    urlMapping[originalPageUrl] = localFileName;
    
    // Also map relative paths and paths without domain
    try {
      const urlObj = new URL(originalPageUrl);
      urlMapping[urlObj.pathname] = localFileName;
      urlMapping[urlObj.pathname + urlObj.search] = localFileName;
    } catch (e) {
      // Invalid URL, skip
    }
  });
  
  // Replace href attributes
  let fixedContent = htmlContent.replace(
    /href=["']([^"']*?)["']/g,
    (match, url) => {
      // Skip external links, anchors, mailto, tel
      if (!url || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        return match;
      }
      
      // Skip external links
      if (url.startsWith('http') && !url.startsWith(baseUrl)) {
        return match;
      }
      
      // Try to find a local file for this URL
      try {
        let checkUrl = url;
        if (url.startsWith('/')) {
          checkUrl = baseUrl + url;
        } else if (!url.startsWith('http')) {
          checkUrl = new URL(url, originalUrl).href;
        }
        
        // Check mappings
        if (urlMapping[checkUrl]) {
          return `href="${urlMapping[checkUrl]}"`;
        }
        
        // Check by pathname only
        const pathname = new URL(checkUrl).pathname;
        if (urlMapping[pathname]) {
          return `href="${urlMapping[pathname]}"`;
        }
      } catch (e) {
        // Invalid URL, keep original
      }
      
      return match;
    }
  );
  
  return fixedContent;
}

function generateSitemapPage(scrapedData: any, originalUrl: string): string {
  const pages = scrapedData.pages || [];
  
  const pageLinks = pages.map((page: any, index: number) => {
    let fileName;
    if (index === 0) {
      fileName = 'index.html';
    } else {
      const cleanPath = page.relativePath || page.url?.split('/').pop() || `page${index}`;
      fileName = `${cleanPath.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`;
    }
    
    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px;">
          <a href="${fileName}" style="color: #2563eb; font-weight: 500;">${page.title || fileName}</a>
        </td>
        <td style="padding: 12px;">
          <a href="${page.url}" target="_blank" style="color: #059669;">View Original →</a>
        </td>
        <td style="padding: 12px; color: #6b7280; font-size: 14px;">
          ${new URL(page.url).pathname}
        </td>
      </tr>
    `;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitemap - Cloned Website</title>
    <link rel="stylesheet" href="style.css">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .sitemap-container { max-width: 1200px; margin: 40px auto; padding: 20px; }
      table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    </style>
</head>
<body style="background: #f3f4f6; margin: 0;">
    <div class="clone-notice-banner">
      🔄 Cloned from <a href="${originalUrl}" target="_blank">${originalUrl}</a>
      <button onclick="window.location.href='index.html'">🏠 Home</button>
    </div>
    
    <div class="sitemap-container">
        <h1 style="color: #111827; margin-bottom: 10px;">📑 Website Sitemap</h1>
        <p style="color: #6b7280; margin-bottom: 30px;">
          Found ${pages.length} page${pages.length !== 1 ? 's' : ''} from the original website
        </p>
        
        <table>
            <thead>
                <tr>
                    <th>Page Title</th>
                    <th>Original URL</th>
                    <th>Path</th>
                </tr>
            </thead>
            <tbody>
                ${pageLinks}
            </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>Click on any page title to view the cloned version, or "View Original" to see the source page.</p>
        </div>
    </div>
</body>
</html>`;
}