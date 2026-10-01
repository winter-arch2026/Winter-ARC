# WINTER ARC — 122 Day Tracker

A mobile-first static PWA for tracking an intense 122-day Winter ARC challenge.

## Included
- 8 daily habits: Workout, 5K/10K Steps, Clean Diet, 4L Water, 7–8h Sleep, Read/Learn, No Alcohol, No Distractions
- Daily workout plans using dumbbells + bodyweight
- Manual step tracking
- Nutrition target calculator using age/sex/height/weight/activity
- Water tracker with adjustable target
- Sleep check-in stored against the previous challenge day
- Learning notes
- Progress, streaks, 122-day calendar and history
- Profile/settings
- LocalStorage persistence
- PWA manifest + service worker
- 6 AM / 10 PM notification scheduler while the app is active/allowed

## GitHub Pages
1. Create a new GitHub repository.
2. Upload all files and the `assets` folder to the repository root.
3. Go to **Settings → Pages**.
4. Select **Deploy from a branch**, choose `main`, folder `/ (root)`.
5. Open the GitHub Pages URL over HTTPS.
6. On Android Chrome, use **Add to Home screen / Install app**.
7. Open Settings inside Winter ARC and enable notifications.

## Alarm limitation
A normal browser page cannot guarantee an exact audible alarm when the browser/app is completely closed or suspended. This build uses PWA/service-worker caching, notifications and an in-page scheduler. For guaranteed background alarms, the next step would be a native Android app or a push/notification backend.

## Data
Challenge data is stored locally in the browser using `localStorage`. There is no backend and no account required.
