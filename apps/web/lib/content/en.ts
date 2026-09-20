import type { Dict } from './types';

export const en: Dict = {
  locale: 'en',
  name: 'English',
  switchTo: 'Русский',

  common: {
    skipToContent: 'Skip to content',
    menu: 'Menu',
    close: 'Close',
    languageLabel: 'Site language',
    themeLabel: 'Switch theme',
    comingSoon: 'Coming soon',
    comingSoonPlay: 'Coming soon to Google Play',
    comingSoonApp: 'Coming soon to the App Store',
    getOnPlay: 'Get it on Google Play',
    getOnAppStore: 'Download on the App Store',
    downloadApk: 'Download APK',
    apkComingSoon: 'APK coming soon',
    notPublishedYet: 'The app is being prepared for release. This link goes live the moment it ships.',
    learnMore: 'Learn more',
    readMore: 'Read more',
    free: 'Free',
    android: 'Android',
    iosSoon: 'iOS — later',
    updated: 'Updated',
    contactUs: 'Contact us',
  },

  nav: {
    features: 'Features',
    security: 'Security',
    rooms: 'Rooms',
    faq: 'FAQ',
    download: 'Download',
    support: 'Support',
  },

  home: {
    meta: {
      title: 'OrzuChat — end-to-end encrypted messenger',
      description:
        'OrzuChat is a private, end-to-end encrypted messenger: one-to-one chats, group Rooms, and encrypted voice and video calls. Keys never leave your phone, so the server cannot read a thing. No ads. 10 languages. Download for Android.',
      keywords: [
        'encrypted messenger app',
        'end-to-end encrypted messenger',
        'private messenger',
        'secure messaging app',
        'private video calls',
        'encrypted video calls',
        'messenger without ads',
        'e2e encryption chat',
        'OrzuChat',
        'android private messenger',
      ],
      ogTitle: 'OrzuChat — the private, end-to-end encrypted messenger',
      ogDescription:
        'Chats, Rooms and video calls nobody else can read. Encryption keys never leave your phone.',
    },
    hero: {
      badge: 'End-to-end encryption on every chat and call',
      h1: 'The messenger where only you can read the conversation',
      sub: 'OrzuChat encrypts every message, file, voice note and call right on your phone. Keys live in your device’s secure storage and never leave it — even our servers only ever see an encrypted stream.',
      secondary: 'How the encryption works',
      imageAlt:
        'Smartphone showing the OrzuChat chat interface with blue and mint message bubbles on a dark navy background',
      note: 'Free. No ads. No data selling.',
      stats: [
        { value: '10', label: 'interface languages' },
        { value: '10', label: 'chat themes' },
        { value: '0', label: 'ads and trackers' },
      ],
    },
    trust: [
      {
        title: 'End-to-end encrypted',
        text: 'Messages, media and calls are encrypted on the sender’s device.',
      },
      { title: 'No advertising', text: 'We show no ads and build no advertising profiles.' },
      { title: 'No data selling', text: 'We never sell or share your information with third parties.' },
      { title: '10 languages', text: 'English, Русский, тоҷикӣ, o‘zbekcha, қазақша and more.' },
    ],
    features: {
      h2: 'Everything you need for private conversations',
      sub: 'All the features of a modern messenger — minus the tracking and the ads.',
      items: [
        {
          icon: 'lock',
          title: 'Private chats',
          text: 'One-to-one conversations with end-to-end encryption: replies, editing, deleting and read receipts.',
        },
        {
          icon: 'phone',
          title: 'Voice & video calls',
          text: 'Calls built on LiveKit with encrypted media frames. Clear audio and steady video, even on a weak connection.',
        },
        {
          icon: 'users',
          title: 'Rooms',
          text: 'Group chats with members, shared messages and group calls — for family, friends or your team.',
        },
        {
          icon: 'media',
          title: 'Photos, video & voice notes',
          text: 'Send images, videos, documents and voice messages. Every file is encrypted before it leaves your phone.',
        },
        {
          icon: 'palette',
          title: '10 chat themes',
          text: 'Ten chat themes plus light and dark mode that follows your phone’s system setting automatically.',
        },
        {
          icon: 'globe',
          title: '10 interface languages',
          text: 'English, Русский, Тоҷикӣ, O‘zbekcha, Қазақша, Кыргызча, Türkçe, Azərbaycanca, Deutsch, Español.',
        },
        {
          icon: 'shield',
          title: 'Screenshot blocking',
          text: 'Screenshots and screen recording are blocked with FLAG_SECURE on Android and hidden content on iOS.',
        },
        {
          icon: 'eye',
          title: 'Privacy controls',
          text: 'Hide your username, photo, phone number, last seen and read receipts. Block anyone you like.',
        },
      ],
    },
    security: {
      h2: 'End-to-end encryption, explained without the jargon',
      sub: 'No cryptography degree required — here is why nobody else can read your conversation.',
      paragraphs: [
        'Think of every message as a box you lock before sending, where only the person you are writing to owns the key. The box travels across the internet and through our servers, but nobody can open it on the way — not your network provider, not us, not anyone intercepting the traffic.',
        'The keys are created on your phone the first time you sign in and stored in your device’s secure storage (Keychain on iOS, Keystore on Android). They are never uploaded and never leave the device. We physically cannot decrypt your conversations, because we have nothing to decrypt them with.',
        'Files, photos and voice notes get the same treatment, and voice and video calls encrypt the media frames themselves — the server only relays encrypted packets between participants.',
      ],
      steps: [
        {
          title: '1. Keys are born on your phone',
          text: 'On first sign-in the app generates an X25519 key pair. The private key stays in your device’s secure storage.',
        },
        {
          title: '2. Messages are locked before sending',
          text: 'Text, files and voice notes become ciphertext (XSalsa20-Poly1305) before they ever leave your phone.',
        },
        {
          title: '3. Only the recipient can unlock',
          text: 'The server forwards an opaque blob. Only your contact’s device, with its private key, can open it.',
        },
      ],
      imageAlt:
        'Glass shield containing a padlock, lit in the OrzuChat brand gradient — an illustration of end-to-end encryption',
      cta: 'More about security',
    },
    rooms: {
      h2: 'Rooms — private groups for the people who matter',
      sub: 'A shared chat and group calls for your family, friends or work team.',
      paragraphs: [
        'A Room is a group chat in OrzuChat. Add members, talk things through, share files and jump into a group call without leaving the conversation.',
        'You decide who is allowed to add you to a Room: everyone, contacts only, or nobody at all. And if you end up somewhere you would rather not be, you can leave at any time.',
      ],
      bullets: [
        'Group messaging with end-to-end encryption',
        'Group voice and video calls',
        'Photos, video, documents and voice notes in the shared chat',
        'Fine-grained control over who can add you to Rooms',
      ],
      imageAlt:
        'Several glass tiles with participant silhouettes in a group video call, connected by glowing lines',
    },
    languages: {
      h2: 'Your language, your style',
      sub: 'OrzuChat speaks ten languages and looks exactly the way you want it to.',
      themesTitle: '10 chat themes, light and dark',
      themesText:
        'Pick your wallpaper and bubble colours: from the classic blue to Night, Ocean, Forest, Sunset, Lavender, Sand, Rose, Graphite and Mint. Light and dark mode follow your system settings automatically.',
      imageAlt: 'Three smartphones showing OrzuChat: the chat list, a conversation and the theme picker',
    },
    showcase: {
      h2: 'A look inside',
      sub: 'A calm, uncluttered interface that stays out of your way.',
      items: [
        {
          src: '/images/hero-phone-chat.png',
          alt: 'OrzuChat conversation screen with messages in blue and mint bubbles',
          title: 'Chats',
          text: 'Replies, editing, deleting and read receipts — everything you already expect.',
        },
        {
          src: '/images/video-call.png',
          alt: 'OrzuChat video call screen with two participants and call controls',
          title: 'Calls',
          text: 'Voice and video with encrypted media frames on top of LiveKit.',
        },
        {
          src: '/images/media-voice-messages.png',
          alt: 'OrzuChat attachment cards: a photo, a video, a document and a voice note waveform',
          title: 'Media & voice',
          text: 'Photos, video, documents and voice notes — each file encrypted before upload.',
        },
        {
          src: '/images/privacy-shield-phone.png',
          alt: 'Smartphone with a frosted privacy layer over the screen and a crossed-out camera symbol',
          title: 'Screen protection',
          text: 'Screenshots and screen recording are blocked inside chats and calls.',
        },
      ],
    },
    faq: {
      h2: 'Frequently asked questions',
      sub: 'The short version — from encryption to installing the app.',
      items: [
        {
          q: 'Is OrzuChat really end-to-end encrypted?',
          a: 'Yes. Every message, file, voice note and call is encrypted on the sender’s device and can only be decrypted on the recipient’s device. It uses X25519 key exchange and the XSalsa20-Poly1305 cipher, with a separate key pair per device.',
        },
        {
          q: 'Can the server or the OrzuChat team read my messages?',
          a: 'No. Private keys are generated on your phone and kept in the device’s secure storage — they are never uploaded. The server only ever holds ciphertext plus the minimum routing information needed to deliver it.',
        },
        {
          q: 'Are calls encrypted too?',
          a: 'Yes. Voice and video calls run on LiveKit with end-to-end encrypted media frames: the server routes the packets but has no key to decrypt them.',
        },
        {
          q: 'What are Rooms?',
          a: 'Rooms are OrzuChat’s group chats. You can message, share files and start group voice or video calls in them. You also control who is allowed to add you to a Room.',
        },
        {
          q: 'Is OrzuChat free? Are there ads?',
          a: 'The app is free. There are no ads, no advertising profiles and no selling of user data.',
        },
        {
          q: 'Which devices does OrzuChat support?',
          a: 'Android is available today as a direct APK install, and the Google Play release is being prepared. An iOS version is planned for later.',
        },
        {
          q: 'Which languages does the app support?',
          a: 'Ten: English, Русский, Тоҷикӣ, O‘zbekcha, Қазақша, Кыргызча, Türkçe, Azərbaycanca, Deutsch and Español. You can switch language at any time in settings.',
        },
        {
          q: 'How do I delete my account and data?',
          a: 'Open Settings → Account → Delete account. Your profile, chat list and server-side keys are removed; any remaining ciphertext stays unreadable without keys. You can also email support@orzuchat.com.',
        },
      ],
    },
    cta: {
      h2: 'Try OrzuChat',
      text: 'Private conversation is one download away. Free, ad-free and tracking-free.',
      note: 'Android is available now. The iOS version is in development.',
    },
  },

  download: {
    meta: {
      title: 'Download OrzuChat for Android — secure messenger',
      description:
        'Download OrzuChat, the free end-to-end encrypted messenger for Android. Direct APK available, Google Play release coming soon, iOS planned for later.',
      keywords: [
        'download OrzuChat',
        'encrypted messenger download',
        'secure messenger apk',
        'end-to-end encrypted messenger android',
        'free private messaging app',
      ],
    },
    h1: 'Download OrzuChat',
    intro: [
      'OrzuChat is free, shows no ads and collects no data for advertising profiles. Here is every way to install it.',
    ],
    playTitle: 'Google Play',
    playText:
      'The app is being prepared for the Google Play store. As soon as it passes review, this button becomes a real link.',
    apkTitle: 'Android APK file',
    apkText:
      'A direct APK install is the fastest way to try OrzuChat before the store release. The link will appear here as soon as the build is published.',
    iosTitle: 'iPhone and iPad',
    iosText: 'The iOS version is in development. We will announce the release on this page.',
    stepsTitle: 'How to install the APK',
    steps: [
      {
        title: '1. Download the file',
        text: 'Tap “Download APK” and wait for your phone’s browser to finish the download.',
      },
      {
        title: '2. Allow the install',
        text: 'Android will ask for permission to install from this source — open settings and confirm.',
      },
      {
        title: '3. Sign in with your number',
        text: 'Open the app and verify your phone number. Your encryption keys are created automatically.',
      },
    ],
    requirementsTitle: 'Requirements',
    requirements: [
      'Android 8.0 or newer',
      'About 80 MB of free storage',
      'A phone number for sign-in verification',
      'Microphone and camera access — used only for calls',
    ],
    imageAlt: 'Three smartphones showing OrzuChat: the chat list, a conversation and the theme picker',
  },

  securityPage: {
    meta: {
      title: 'OrzuChat security — how end-to-end encryption works',
      description:
        'A detailed look at OrzuChat security: X25519 keys generated on-device, XSalsa20-Poly1305 encryption, encrypted call media frames, screenshot blocking and privacy controls.',
      keywords: [
        'end-to-end encryption',
        'e2e encrypted messenger',
        'messenger security',
        'x25519',
        'private video calls',
        'secure chat encryption',
      ],
    },
    h1: 'Security at OrzuChat',
    intro: [
      'Privacy in OrzuChat is not a setting you have to switch on — it is how the app works by default. This page explains what is protected, how, and what we deliberately do not know about you.',
    ],
    imageAlt: 'Glass shield with a padlock in the brand gradient — a symbol of OrzuChat end-to-end encryption',
    sections: [
      {
        h2: 'Keys are created on the device and stay there',
        paragraphs: [
          'On first sign-in, the app generates an X25519 key pair on your phone — a separate pair for every device. The private key goes straight into the operating system’s secure storage (Android Keystore, iOS Keychain) and never leaves: it is not included in server-side backups, logs or network requests.',
          'Only the public key is uploaded, because your contacts need it to encrypt messages for you. A private key cannot be derived from a public one, so storing it openly is safe.',
        ],
      },
      {
        h2: 'How a message is encrypted',
        paragraphs: [
          'The sender derives a shared secret from their private key and the recipient’s public key, then encrypts the content with XSalsa20-Poly1305. Poly1305 adds an authentication tag: change a single bit of the ciphertext and the recipient’s app will notice and refuse to open it.',
          'What travels over the network and through our servers is therefore an opaque blob of bytes. We keep no copy of the keys and cannot recover the plaintext — not on request, and not by accident.',
        ],
      },
      {
        h2: 'Files, photos and voice notes',
        paragraphs: [
          'Attachments are encrypted on the device before upload. Storage only ever receives an encrypted file, and the key to it travels inside the encrypted message. Without that key, the file is meaningless data.',
        ],
      },
      {
        h2: 'Voice and video calls',
        paragraphs: [
          'Calls are built on LiveKit with end-to-end encrypted media frames. The server connects participants and routes packets, but it holds no key and can neither listen in nor record the video.',
        ],
      },
      {
        h2: 'Screenshot and screen-recording protection',
        paragraphs: [
          'Chats and calls turn on screen protection: Android uses FLAG_SECURE, and on iOS the content is hidden during screen recording and in the app switcher. That blocks screenshots and keeps sensitive content out of system previews.',
        ],
      },
      {
        h2: 'Privacy controls',
        list: [
          'Hide your username, profile photo or phone number from strangers',
          'Turn off your last-seen timestamp',
          'Turn off read receipts',
          'Block any user',
          'Choose who is allowed to add you to Rooms',
        ],
      },
      {
        h2: 'Being honest about what encryption cannot do',
        paragraphs: [
          'End-to-end encryption protects data in transit, not the device itself. If your phone is unlocked and in someone else’s hands, they can simply read the screen. Use a passcode or biometrics, keep the OS updated and avoid apps from untrusted sources.',
          'The person you are talking to can also see your messages and keep them. Screenshot blocking makes copying harder, but it cannot stop someone photographing the screen with another phone.',
          'We do not hide the fact that a conversation exists: the server knows two accounts are exchanging messages so it can deliver them. The content itself stays out of reach.',
        ],
      },
    ],
    tableTitle: 'The technology in brief',
    table: [
      { label: 'Key exchange', value: 'X25519, one key pair per device' },
      { label: 'Content encryption', value: 'XSalsa20-Poly1305 (authenticated encryption)' },
      { label: 'Private key storage', value: 'Android Keystore / iOS Keychain, never uploaded' },
      { label: 'Calls', value: 'LiveKit with end-to-end encrypted media frames' },
      { label: 'Screen protection', value: 'FLAG_SECURE on Android, hidden content on iOS' },
      { label: 'What the server sees', value: 'Ciphertext plus the minimum needed to deliver it' },
    ],
  },

  support: {
    meta: {
      title: 'OrzuChat support — help and contact',
      description:
        'OrzuChat support: how to reach us, fix sign-in, call and notification problems, and how to delete your account.',
      keywords: ['OrzuChat support', 'contact OrzuChat', 'messenger help', 'delete OrzuChat account'],
    },
    h1: 'Support',
    intro: [
      'Trouble signing in, notifications not arriving, or a question about privacy? Write to us — we answer in English and Russian.',
    ],
    emailTitle: 'Email',
    emailText: 'Our main support channel. We usually reply within one or two business days.',
    telegramTitle: 'Telegram',
    telegramText: 'Quick questions and release news live in the OrzuX channel.',
    faqTitle: 'Quick answers',
    faq: [
      {
        q: 'The verification code does not arrive',
        a: 'Check that the country code is correct and that you have signal. Codes are valid for a few minutes; if nothing arrives, wait for the timer and request a new one. If it still fails, email us with your number in international format.',
      },
      {
        q: 'I am not getting notifications',
        a: 'Make sure notifications are allowed in Android settings and that battery optimisation is disabled for OrzuChat. After reinstalling the app, the push token refreshes automatically on your next sign-in.',
      },
      {
        q: 'Poor call quality',
        a: 'Calls are sensitive to network quality: try Wi-Fi instead of mobile data, or turn off video and keep audio only. Also check that the app has microphone and camera permission.',
      },
      {
        q: 'Old messages do not open on my new phone',
        a: 'Encryption keys never leave a device, so history does not transfer automatically. A new device generates its own key pair and can read messages sent after you signed in on it.',
      },
      {
        q: 'How do I delete my account?',
        a: 'In the app: Settings → Account → Delete account. Or email support@orzuchat.com from the number linked to your account.',
      },
      {
        q: 'I found a vulnerability',
        a: 'Please report it to privacy@orzuchat.com. Include reproduction steps and give us a chance to fix it before publishing details.',
      },
    ],
  },

  privacy: {
    meta: {
      title: 'OrzuChat Privacy Policy',
      description:
        'The OrzuChat privacy policy: what we store (phone number, username, display name, optional photo, push token, last seen), why we cannot read your messages, and how to delete your account.',
      keywords: [
        'OrzuChat privacy policy',
        'messenger privacy',
        'what data does a messenger store',
        'delete OrzuChat account',
      ],
    },
    h1: 'Privacy Policy',
    updated: '20 September 2026',
    intro: [
      'OrzuChat is built by OrzuX. This document explains in plain language what data the app collects, why, and what we are simply unable to learn about your conversations.',
      'The short version: the contents of your chats, files and calls are end-to-end encrypted, the keys only exist on your devices, and we cannot read your messages.',
    ],
    sections: [
      {
        h2: '1. We cannot see the contents of your conversations',
        paragraphs: [
          'Every message, attachment, voice note and call media stream is encrypted on the sender’s device and decrypted only on the recipient’s device. Private keys are generated on the phone and stored in the operating system’s secure storage — they are never sent to our servers.',
          'What the server stores is ciphertext we are incapable of decrypting: we do not have, and cannot have, the corresponding key. The same applies to third-party requests — we cannot hand over message content because we technically cannot read it.',
        ],
      },
      {
        h2: '2. What we do store',
        list: [
          'Phone number — your account identifier and the way you sign in.',
          'Username and display name — so contacts can find and recognise you.',
          'Profile photo — optional; you can skip it or hide it.',
          'Public keys of your devices — needed so others can encrypt messages to you.',
          'Device push token — used only to deliver new message and call notifications.',
          'Last-seen timestamp — you can hide it in privacy settings.',
          'Delivery metadata: chat and participant identifiers, timestamps, and the size of encrypted attachments.',
          'Encrypted attachments — stored in our file storage in encrypted form only.',
        ],
      },
      {
        h2: '3. What we never do',
        list: [
          'We do not show ads and do not build advertising profiles.',
          'We do not sell, rent or share your data with third parties for commercial purposes.',
          'We do not read or analyse your conversations — this is technically impossible.',
          'We do not harvest your address book without explicit permission.',
          'We do not embed third-party advertising or tracking SDKs.',
        ],
      },
      {
        h2: '4. Notifications',
        paragraphs: [
          'Push notifications are delivered through Expo and Google (FCM). The decrypted message body is never included: a notification carries only the sender’s name and a marker that a message or call arrived. The text itself is decrypted inside the app, on your device.',
        ],
      },
      {
        h2: '5. App permissions',
        list: [
          'Camera and microphone — only during calls and for photos or videos you choose to send.',
          'Notifications — for messages and incoming calls.',
          'Photos and files — only when you pick an attachment to send.',
          'None of these permissions are used in the background to collect data.',
        ],
      },
      {
        h2: '6. How long we keep data',
        paragraphs: [
          'Encrypted messages and attachments are kept as long as they are needed for delivery and synchronisation across your devices, or until you delete them. A deleted message is removed from the server.',
          'Profile data is kept while the account exists. After deletion it is erased, and any remaining ciphertext stays unreadable without keys.',
        ],
      },
      {
        h2: '7. Your rights and controls',
        list: [
          'Hide your username, photo, phone number, last seen and read receipts.',
          'Block any user.',
          'Restrict who can add you to Rooms.',
          'Request a copy of your profile data.',
          'Delete your account at any time.',
        ],
      },
      {
        h2: '8. How to delete your account',
        paragraphs: [
          'In the app, open Settings → Account → Delete account and confirm. We delete your profile, username, photo, public keys, push tokens and last-seen record.',
          'If you no longer have access to the app, email privacy@orzuchat.com from the phone number linked to the account and we will delete the data after verifying it.',
        ],
      },
      {
        h2: '9. Children',
        paragraphs: [
          'OrzuChat is not intended for children under 13. If you believe a child signed up without parental consent, contact us and we will remove the account.',
        ],
      },
      {
        h2: '10. Changes to this policy',
        paragraphs: [
          'If this policy changes we will update the date at the top of the page, and we will announce material changes inside the app. Continuing to use OrzuChat means you accept the updated version.',
        ],
      },
      {
        h2: '11. Contact',
        paragraphs: [
          'Privacy and data questions: privacy@orzuchat.com. General support: support@orzuchat.com. The app is developed by OrzuX, https://www.orzux.com.',
        ],
      },
    ],
  },

  terms: {
    meta: {
      title: 'OrzuChat Terms of Service',
      description:
        'The OrzuChat terms of service: how the service works, your responsibilities as a user, acceptable use, limitations of liability and how to end your account.',
      keywords: ['OrzuChat terms of service', 'messenger terms', 'OrzuChat rules', 'user agreement messenger'],
    },
    h1: 'Terms of Service',
    updated: '20 September 2026',
    intro: [
      'By installing and using OrzuChat you agree to these terms. Please read them — they are written in plain language and take a few minutes.',
    ],
    sections: [
      {
        h2: '1. About the service',
        paragraphs: [
          'OrzuChat is a mobile app for end-to-end encrypted messaging and calling, developed by OrzuX. The app is provided free of charge for personal and business communication.',
        ],
      },
      {
        h2: '2. Your account',
        list: [
          'You need a working phone number that you control in order to register.',
          'You are responsible for your device and access to it: anyone who unlocks your phone can read your conversations.',
          'One account belongs to one person. Accounts may not be transferred to others.',
          'The minimum age for using the service is 13.',
        ],
      },
      {
        h2: '3. Acceptable use',
        paragraphs: ['While using OrzuChat, you agree not to:'],
        list: [
          'Send spam, bulk unsolicited messages, or run scams.',
          'Distribute unlawful material, including content involving violence or the exploitation of children.',
          'Harass, threaten or incite hatred against other people.',
          'Distribute malware or attempt to break into the service or other people’s accounts.',
          'Automate the app or generate load that degrades the service for others.',
          'Infringe copyright or any other rights of third parties.',
        ],
      },
      {
        h2: '4. Your content',
        paragraphs: [
          'Everything you send remains yours. We claim no rights over your content and cannot read it — it is encrypted. You are solely responsible for what you send and for complying with the law in your country.',
        ],
      },
      {
        h2: '5. Moderation and suspension',
        paragraphs: [
          'Because message content is encrypted, we do not moderate messages. We may restrict or terminate access to an account in response to substantiated reports, abuse, intrusion attempts or violations of these terms.',
          'Inside the app you can block any user yourself and limit who may add you to Rooms.',
        ],
      },
      {
        h2: '6. Service availability',
        paragraphs: [
          'We aim for uninterrupted service but cannot guarantee it. The service may be unavailable because of updates, provider outages or circumstances beyond our control. We may change and improve app features over time.',
        ],
      },
      {
        h2: '7. Disclaimer of warranties',
        paragraphs: [
          'The app is provided “as is”. We do not warrant that it fits any particular purpose or will operate without errors. Encryption protects data in transit and at rest, but it cannot protect a compromised device.',
        ],
      },
      {
        h2: '8. Limitation of liability',
        paragraphs: [
          'To the extent permitted by law, OrzuX is not liable for indirect damages, lost profits, lost data or reputational harm arising from the use of, or inability to use, OrzuChat.',
        ],
      },
      {
        h2: '9. Ending your use',
        paragraphs: [
          'You can delete your account at any time via Settings → Account → Delete account. After deletion your access ends and profile data is erased in line with the privacy policy.',
        ],
      },
      {
        h2: '10. Changes to these terms',
        paragraphs: [
          'We may update these terms. The current version is always on this page with its update date, and we will announce material changes inside the app.',
        ],
      },
      {
        h2: '11. Contact',
        paragraphs: [
          'Questions about these terms: support@orzuchat.com. Developed by OrzuX, https://www.orzux.com.',
        ],
      },
    ],
  },

  footer: {
    tagline: 'The private, end-to-end encrypted messenger: chats, Rooms and calls that only you can see.',
    productTitle: 'Product',
    legalTitle: 'Legal',
    companyTitle: 'Company',
    languagesTitle: 'App languages',
    madeBy: 'Made by',
    orzuxText: 'AI solutions for business',
    rights: 'All rights reserved.',
    availability: 'Android — now · Google Play — soon · iOS — later',
  },

  notFound: {
    title: 'Page not found',
    text: 'The address may be mistyped, or the page has moved.',
    cta: 'Go to homepage',
  },
};
