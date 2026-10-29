# Whispr ✨

**Your words. Your space. Your Whispr.**

Whispr is a modern, privacy-conscious social platform designed to give people a space to express themselves, share thoughts, receive anonymous messages, and connect through stories and personal profiles.

Built with Next.js, TypeScript, Firebase, and a carefully crafted purple-and-pink interface, Whispr focuses on simplicity, expressive design, and a smooth user experience.

---

## ✨ Features

### 🔐 Authentication
- Email and password registration and sign-in.
- Google authentication through Firebase.
- Personalized user profiles.
- Custom usernames and public profile links.

### 💌 Anonymous Messaging
- Receive messages through your public profile.
- Manage your inbox.
- Enable or disable incoming messages through profile settings.

### 📖 Stories and Sharing
- Share stories and personal updates.
- Create shareable profile and question cards.
- Generate visual cards for sharing.
- Copy and share profile links.

### 🎨 Personalization
- Multiple visual themes.
- A modern, responsive interface.
- Purple and pink accents with glassmorphism-inspired styling.
- Smooth animations and thoughtful interaction details.

### 👤 User Profiles
- Custom usernames.
- Public profile pages.
- Profile information and settings.
- Shareable personal links.

### 🌙 User Experience
- Responsive layouts for desktop and mobile.
- Accessible form labels and interactive controls.
- Loading states and user-friendly error messages.
- A dedicated dashboard for managing your Whispr experience.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | React framework and application routing |
| React | User interface |
| TypeScript | Type safety |
| Firebase Authentication | User authentication |
| Cloud Firestore | User profiles, usernames, and application data |
| CSS | Responsive styling and visual design |
| Lucide React | Interface icons |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) — a current supported LTS version.
- npm.
- A Firebase project.
- Git.

### 1. Clone the repository

Replace the placeholder below with your actual GitHub repository URL.

```bash
git clone https://github.com/redux-next/whispr.git
cd whispr
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).

Enable the following services:

- **Authentication**
  - Email/Password
  - Google
- **Cloud Firestore**

Register a web application in Firebase and copy its configuration.

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Use the variable names expected by your existing Firebase configuration in `src/lib/firebase.ts`. If your project uses different names, update this example accordingly.

**Security note:** Never commit `.env.local`, service account credentials, or private keys. Firebase client configuration is intended for client applications, but Firestore Security Rules and appropriate authentication checks are essential for protecting user data.

### 4. Configure Firestore

Whispr uses Firestore for application data, including profiles and username records.

The current application expects collections such as:

- `profiles`
- `usernames`
- Message records used by the inbox.

Configure your Firestore Security Rules to enforce authentication, ownership, valid data, and appropriate access to public profiles and messages.

Do not deploy permissive production rules that allow unrestricted reading or writing.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

The following is a simplified overview of the application structure. Your exact files may differ.

```text
whispr/
├── public/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── dashboard.css
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── login.css
│   │   ├── u/
│   │   │   └── [username]/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── icon.png
│   ├── components/
│   │   ├── UniversalFooter.tsx
│   │   └── universal-footer.css
│   └── lib/
│       └── firebase.ts
├── .env.local
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎨 Branding

Whispr uses a dark, expressive visual identity inspired by neon purple and pink gradients.

- **Primary aesthetic:** Dark purple with violet and magenta accents.
- **Interface style:** Modern, minimal, and glassmorphism-inspired.
- **Typography:** Clean and contemporary.
- **App icon:** A glowing `w.` mark with a sparkle motif.
- **Browser icon:** The matching Whispr favicon.

The brand is designed to feel personal, creative, and welcoming.

---

## 🔒 Privacy and Security

Privacy is an important part of Whispr's purpose.

When developing or deploying the application:

- Protect private messages with appropriate Firestore Security Rules.
- Validate usernames and user-submitted content.
- Restrict profile updates to authorized users.
- Avoid exposing private email addresses or internal user identifiers on public profiles.
- Add rate limiting and abuse prevention for anonymous messaging.
- Never store passwords directly in Firestore.
- Keep administrative credentials and private keys out of client-side code.

Anonymous messaging should not be treated as a guarantee of complete anonymity. Authentication, logging, database rules, and infrastructure may still expose information to authorized systems or administrators.

---

## 🗺️ Roadmap

Potential areas for future development include:

- [ ] Enhanced profile customization.
- [ ] Improved story creation and viewing.
- [ ] Additional themes and personalization.
- [ ] Better inbox organization and message management.
- [ ] Notifications and real-time messaging improvements.
- [ ] Stronger spam prevention and reporting tools.
- [ ] Accessibility and performance improvements.
- [ ] Progressive Web App enhancements.

This roadmap describes potential improvements, not features guaranteed to be implemented.

---

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make your changes.
4. Run the available checks.

   ```bash
   npm run build
   ```

5. Commit your changes.

   ```bash
   git add .
   git commit -m "feat: describe your change"
   ```

6. Push your branch and open a pull request.

Please avoid committing secrets, generated build files, or unrelated changes.

---

## 👨‍💻 Creator

**Gyanam**

Developer · Builder · Dreamer

Whispr is built with care to create a space where people can express their thoughts and share their voices.

---

## 📄 License

No license has been specified here. Before publishing the repository as open source, add a `LICENSE` file and choose a license that matches your intentions.

---

<p align="center">
  <strong>Whispr.</strong><br/>
  <em>Your words. Your space. Your Whispr.</em>
</p>
