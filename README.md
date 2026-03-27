# Harbour Studios

Landing page + Node.js/Express contact form backend.

---

## Folder structure

```
harbour-studios/
├── server/
│   └── index.js              ← Express server (API + static file serving)
├── public/                   ← All frontend files (HTML, CSS, JS)
│   ├── index.html
│   ├── assets/
│   │   └── favicon.svg
│   ├── css/
│   │   ├── style.css
│   │   └── project.css
│   ├── js/
│   │   ├── main.js
│   │   └── contact.js
│   ├── css/
│   │   ├── style.css              ← Main site styles
│   │   ├── style.min.css
│   │   ├── project.css            ← Portfolio page shared styles
│   │   └── project.min.css
│   └── pages/
│       ├── about.html
│       ├── contact.html
│       ├── velvet-room-salon/     ← Landing page demo (self-contained)
│       │   ├── index.html
│       │   └── assets/
│       │       ├── icons/
│       │       ├── images/
│       │       └── webp/
│       ├── trustflow-plumbing/    ← Business website demo (self-contained)
│       │   ├── index.html
│       │   ├── css/
│       │   └── assets/
│       │       └── icons/
│       └── iron-forge-gym/        ← Growth website demo (self-contained)
│           ├── index.html
│           ├── css/
│           ├── js/
│           ├── pages/
│           └── assets/
├── data/
│   └── submissions.json      ← All form submissions saved here automatically
├── .env                      ← Your credentials — never share or commit this
├── .gitignore
├── package.json
└── README.md
```

---

## First-time setup

### 1. Install Node.js
Download the LTS version from https://nodejs.org and install it.

### 2. Open a terminal in the harbour-studios folder

On Windows: right-click the folder → "Open in Terminal"
On Mac: right-click → "New Terminal at Folder"

### 3. Install dependencies
```
npm install
```
This creates a `node_modules` folder. It only needs running once.

### 4. Set up your email credentials
Open `.env` in any text editor and fill in your details:

```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
OWNER_EMAIL=louistucker@live.co.uk
PORT=3000
```

**You need a Gmail App Password — not your normal Gmail password.**
Steps:
1. Go to https://myaccount.google.com
2. Security → 2-Step Verification (turn this ON if not already)
3. Security → App passwords
4. "Select app" → Mail | "Select device" → Other → type "Harbour Studios"
5. Click Generate — copy the 16-character code (ignore spaces) into .env

### 5. Start the server
```
npm start
```

For development (auto-restarts when you edit files):
```
npm run dev
```

### 6. Open the site
Visit http://localhost:3000 in your browser.

---

## How the contact form works

1. Visitor fills in the form on the contact page
2. The form POSTs data to `POST /api/contact` on your Express server
3. The server does three things simultaneously:
   - Saves the submission to `data/submissions.json`
   - Emails a full enquiry notification to louistucker@live.co.uk
   - Emails an automatic confirmation to the person who submitted
4. The form shows a success message to the visitor

---

## Viewing your leads

Open `data/submissions.json` in any text editor or code editor.
Each submission looks like this:

```json
{
  "id": 1704067200000,
  "submittedAt": "2024-01-01T12:00:00.000Z",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.co.uk",
  "business": "Smith & Co",
  "service": "Brochure Website (up to 5 pages)",
  "budget": "£1,000 – £2,000",
  "message": "We need a new website..."
}
```

---

## Before going live

- [ ] Replace "Harbour Studios" with your actual studio name in all HTML files
- [ ] Update the portfolio link in `server/index.js` (search for `yourwebsite.co.uk`)
- [ ] Replace the portfolio project folders (velvet-room-salon, trustflow-plumbing, iron-forge-gym) with your real work
- [ ] Update pricing figures on the landing page
- [ ] Deploy to Railway, Render, or Heroku — set your .env values as environment variables in their dashboard

---

## Troubleshooting

**"Authentication failed" email error**
→ Make sure you're using an App Password, not your regular Gmail password.
→ Make sure 2-Step Verification is enabled on your Google account.

**Port already in use**
→ Change `PORT=3000` to `PORT=3001` in `.env` and restart.

**Form shows error after submitting**
→ Check the terminal where `npm start` is running — the full error message is printed there.
