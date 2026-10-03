# YAAM REALTORS — DEVELOPMENT SKILLS

## 1. Product Design Skill

The website is a premium real-estate marketplace.

Priorities:

1. Trust
2. Property discovery
3. Visual quality
4. Conversion
5. Performance
6. Mobile usability

Never create generic SaaS layouts for the public website.

---

## 2. Real Estate UX Skill

Understand the user's intent:

- Buy property
- Rent property
- Find commercial property
- Find land
- Contact agent

Property information must be scannable.

Users should be able to understand:

- What is it?
- Where is it?
- How much?
- How large?
- What features does it have?
- How do I contact Yaam?

within seconds.

---

## 3. Premium UI Skill

Use:

- Strong typography
- Large photography
- Generous spacing
- Clear hierarchy
- Subtle shadows
- Refined borders
- Controlled corner radius
- Consistent iconography

Avoid:

- Excessive gradients
- Excessive glassmorphism
- Neon colors
- Excessive rounded cards
- Random animations
- Template-like layouts

---

## 4. Animation Skill

Use Motion / Framer Motion.

Animations should communicate:

- Navigation
- Hierarchy
- Interaction
- State changes

Preferred:

- fade
- slide
- scale
- stagger
- image zoom
- subtle parallax

Avoid animation overload.

Respect:

prefers-reduced-motion.

---

## 5. Property Card Skill

Property cards are a primary conversion component.

Always prioritize:

1. Image
2. Price
3. Property type
4. Location
5. Key specifications
6. CTA

Cards must work on:

- mobile
- tablet
- desktop

---

## 6. Property Detail Skill

Property detail pages must be information-rich but easy to scan.

Required hierarchy:

Gallery
→ Title
→ Location
→ Price
→ Key facts
→ Description
→ Highlights
→ Amenities
→ Location
→ Contact

WhatsApp CTA must be prominent.

---

## 7. WhatsApp Conversion Skill

WhatsApp is the primary conversion channel.

Messages must automatically include property context.

Example:

"Hi Yaam Realtors, I'm interested in [PROPERTY]."

Never hardcode the WhatsApp number in multiple components.

Use centralized configuration.

---

## 8. Admin Dashboard Skill

The admin dashboard should feel like a professional SaaS product.

Prioritize:

- speed
- clarity
- tables
- filters
- search
- bulk operations
- confirmation dialogs
- status badges

Admin should be able to manage properties without touching code.

---

## 9. Database Skill

Use relational database design.

Do not duplicate property information unnecessarily.

Use:

- proper foreign keys
- indexes
- timestamps
- enums where appropriate
- constraints
- RLS

Public users should only access published public content.

---

## 10. Security Skill

Never expose:

- service role keys
- database credentials
- private storage credentials
- admin secrets

Never rely only on frontend route protection.

Always validate permissions server-side.

---

## 11. Image Skill

Real estate images are critical.

Use:

- responsive images
- lazy loading
- optimized formats
- proper aspect ratios
- meaningful alt text

Admin image uploads must support:

- multiple images
- deletion
- ordering
- cover image

---

## 12. SEO Skill

Every public property should have:

- unique title
- description
- canonical URL
- Open Graph metadata
- structured data

Use clean property slugs.

Generate sitemap and robots.txt.

---

## 13. Responsive Design Skill

Mobile is not an afterthought.

Design specifically for:

320px
375px
390px
430px
768px
1024px
1440px
1920px

Property browsing must remain excellent on small screens.

---

## 14. Accessibility Skill

Use:

- semantic HTML
- keyboard navigation
- proper labels
- accessible dialogs
- alt text
- focus indicators
- sufficient contrast

Never use color as the only indicator of state.

---

## 15. Performance Skill

Prioritize:

- server rendering where appropriate
- optimized queries
- image optimization
- lazy loading
- pagination
- caching
- minimal JavaScript

Avoid unnecessary client components.

---

## 16. Code Quality Skill

Use:

TypeScript
strict typing
small reusable components
clear naming
consistent architecture

Avoid:

- giant components
- duplicated logic
- magic strings
- hardcoded business configuration
- unnecessary abstractions

---

## 17. Validation Skill

Use Zod for important input validation.

Validate:

- property forms
- enquiries
- authentication
- filters
- uploads

Never trust client input.

---

## 18. Error State Skill

Every major feature needs:

Loading
Success
Error
Empty

Never leave blank screens.

---

## 19. Client Presentation Skill

This project will be shown directly to a paying client.

Before considering a page complete, ask:

"Would I confidently open this page in a client meeting?"

If not, improve it.

---

## 20. Anti-AI-Template Skill

Do not generate repetitive AI-style layouts.

Avoid:

- identical rounded cards everywhere
- excessive gradients
- meaningless floating blobs
- generic "Empowering businesses..." copy
- excessive centered text
- fake statistics
- fake testimonials
- fake awards

Use real business information supplied by Yaam.

When information is unavailable, use editable CMS fields or clearly marked demo content.

---

## 21. Verification Skill

Never fabricate:

- properties
- prices
- addresses
- awards
- customer numbers
- reviews
- certifications
- project counts
- business achievements

Demo data must be clearly identifiable as demo data.

---

## 22. Git Skill

Make logical commits.

Suggested:

feat: establish yaam design system
feat: implement property marketplace
feat: add property details
feat: add whatsapp enquiry flow
feat: implement authentication
feat: implement admin dashboard
feat: implement property management
feat: implement image storage
feat: implement enquiry management
feat: add seo
fix: responsive property experience
fix: production build issues

Do not commit:

.env
credentials
API keys
service-role keys
private data

---

## 23. Completion Skill

Do not declare the project complete after only checking that the build passes.

Verify:

- public pages
- search
- filters
- property details
- WhatsApp
- authentication
- admin
- property creation
- image uploads
- publishing
- enquiries
- mobile
- desktop
- security
- SEO
- build