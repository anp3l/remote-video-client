# Remote Video Library – Frontend

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description

A modern Angular application for managing and streaming your personal video library remotely. Built with Angular 20, Material Design, and Tailwind CSS, featuring secure authentication, video upload with metadata management, and seamless HLS streaming playback.

---

## Screenshots

<table>
  <tr>
    <td>Login Page</td>
    <td>Empty Library State</td>
  </tr>
  <tr>
    <td><a href="screenshots/login.png"><img src="screenshots/login.png" width="400"></a></td>
    <td><a href="screenshots/empty.png"><img src="screenshots/empty.png" width="400"></a></td>
  </tr>
  <tr>
    <td>Library with Videos</td>
    <td>Upload Interface</td>
  </tr>
  <tr>
    <td><a href="screenshots/library.png"><img src="screenshots/library.png" width="400"></a></td>
    <td><a href="screenshots/upload.png"><img src="screenshots/upload.png" width="400"></a></td>
  </tr>
  <tr>
    <td>Edit Video</td>
    <td>Video Player</td>
  </tr>
  <tr>
    <td><a href="screenshots/edit.png"><img src="screenshots/edit.png" width="400"></a></td>
    <td><a href="screenshots/player.png"><img src="screenshots/player.png" width="400"></a></td>
  </tr>
</table>



---

## Features

- 🔐 **User Authentication**: Secure signup and login with JWT token management
- 📤 **Video Upload**: Upload videos with optional custom thumbnails (auto-generated if not provided)
- 📝 **Metadata Management**: Add and edit video titles, descriptions, tags, and categories
- 🎬 **Video Playback**: Stream videos using Video.js player in a responsive overlay
- 🔍 **Browse & Filter**: View all your videos in grid or list view with filtering capabilities
- ✏️ **Edit & Delete**: Modify video metadata or remove videos from your library
- ⬇️ **Download**: Download original video files
- 🎨 **Modern UI**: Responsive design with Angular Material components and Tailwind CSS styling
- 🔒 **Protected Routes**: Authentication guards to secure private content

---

## Requirements

- **Node.js** v18 or higher
- **Angular CLI** v20 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Backend server running (see [remote-video-server](https://github.com/anp3l/remote-video-server))

---

## Setup

### 1. Clone the repository

git clone https://github.com/anp3l/remote-video-client.git

cd remote-video-client

### 2. Install dependencies

npm install

### 3. Configure the backend URL

Edit `src/app/core/config/app.config.ts` if your backend is not running on the default URL:

export const AppConfig = {

apiBaseUrl: 'http://localhost:3070', // Change if needed

// ... other config

};

### 4. Start the development server

npm start

or

ng serve

The app will be available at [**http://localhost:4200**](http://localhost:4200)

---

## Usage

### Authentication

1. Navigate to [**http://localhost:4200**](http://localhost:4200)
2. **Sign up** with username, email, and password
3. **Login** with your credentials to access your video library

### Upload Videos

1. Click the upload button on the main page
2. Select one or more video files (MP4, MOV, AVI supported)
3. Optionally add a custom thumbnail (JPEG, PNG, WebP)
4. Fill in metadata: title, description, tags, category
5. Click upload and monitor progress

### Browse & Play Videos

1. View your videos in grid or list view
2. Use filters to find specific videos
3. Click on a video to play it in an overlay player
4. Player supports HLS streaming for optimized playback

### Manage Videos

- **Edit**: Modify video metadata
- **Delete**: Remove videos permanently from your library
- **Download**: Download the original video file

---

## Project Structure
```
src/
├── app/
│ ├── core/ # Core application modules
│ │ ├── components/ # Core feature components
│ │ │ ├── delete-confirm-dialog/ # Confirmation dialog for deletions
│ │ │ ├── library-header/ # Main navigation header
│ │ │ ├── login/ # Login page
│ │ │ ├── signup/ # Registration page
│ │ │ ├── video-card/ # Video card with thumbnail and metadata 
│ │ │ ├── video-edit-dialog/ # Dialog for editing video metadata
│ │ │ ├── video-grid/ # Grid/list view for videos
│ │ │ ├── video-library/ # Main library page container
│ │ │ ├── video-player-dialog/ # Video.js player in overlay
│ │ │ └── video-upload-dialog/ # Upload form dialog
│ │ ├── config/
│ │ │ └── app.config.ts # App-wide configuration (API URL, limits)
│ │ ├── guards/
│ │ │ ├── auth-guard.ts # Protects authenticated routes
│ │ │ └── upload-guard.ts # Guards for upload operations
│ │ ├── interceptors/
│ │ │ └── auth.interceptor.ts # Injects JWT token in HTTP requests
│ │ ├── models/
│ │ │ ├── auth.model.ts # Authentication types and interfaces
│ │ │ └── video.model.ts # Video data models
│ │ └── services/
│ │ ├── auth.service.ts # Authentication logic (login, signup, token)
│ │ ├── upload-progress.service.ts # Manages upload state and progress
│ │ ├── video-api.service.ts # HTTP calls to backend API
│ │ └── video.service.ts # Video business logic and state
│ ├── shared/ # Shared reusable modules
│ │ ├── components/
│ │ │ ├── app-footer/ # Application footer
│ │ │ └── upload-progress/ # Upload progress indicator widget
│ │ └── pipes/
│ │ ├── duration-format-pipe.ts # Formats video duration (e.g., "1:23:45")
│ │ └── file-size-pipe.ts # Formats file sizes (e.g., "125 MB")
│ ├── app.component.ts # Root application component
│ ├── app.config.ts # Angular app configuration
│ ├── app.html # Root template
│ ├── app.routes.ts # Application routing
│ └── app.scss # Root styles
├── index.html # Main HTML entry point
├── main.ts # Application bootstrap
└── styles.scss # Global styles and theme
```
### Key Components

**Core Components:**
- **login/signup**: Handle user authentication
- **video-library**: Main library page
- **video-grid**: Display videos in grid or list layout
- **video-card**: Individual video card displaying thumbnail and metadata (title, duration, category, tags)
- **video-upload-dialog**: Dialog for uploading new videos
- **video-edit-dialog**: Dialog for editing video metadata
- **video-player-dialog**: Overlay player with Video.js
- **delete-confirm-dialog**: Confirmation dialog for video deletion
- **library-header**: Navigation header with logout

**Services:**
- **auth.service**: Manages login, signup, JWT tokens, and user state
- **video-api.service**: HTTP calls to backend API
- **video.service**: Business logic and video state management
- **upload-progress.service**: Tracks multiple upload progress

**Guards:**
- **auth-guard**: Protects routes requiring authentication
- **upload-guard**: Validates upload operations

**Pipes:**
- **duration-format**: Converts seconds to HH:MM:SS format
- **file-size**: Converts bytes to readable KB/MB/GB

---

## Configuration

### Video Upload Limits

Default limits (configurable in `app.config.ts`):

- **Max video size**: 2048 MB (2 GB)
- **Max video duration**: 3600 seconds (1 hour)
- **Supported formats**: MP4, MOV, AVI
- **Max thumbnail size**: 10 MB
- **Supported thumbnail formats**: JPEG, PNG, WebP

### Categories

Available video categories:
- Programming
- Photography
- Cooking
- Fitness
- Music
- Travel
- Business
- Other

---

## Tech Stack

- **Angular** 20.3.0
- **Angular Material** 20.2.12
- **Tailwind CSS** 4.1.17
- **Video.js** 8.23.4 (HLS streaming player)
- **RxJS** 7.8.0 (reactive programming)
- **TypeScript** 5.9.2

---

## Development

### Build for production

npm run build

Output will be in `dist/remote-video-client/browser/`

### Serve production build locally

After building, you can serve the production build locally for testing:

cd dist/remote-video-client/browser

http-server -p 8080 -c-1 --proxy http://localhost:8080?

**Note**: You need to have `http-server` installed globally:

npm install -g http-server

The production build will be available at [**http://localhost:8080**](http://localhost:8080)

### Run tests

npm test

**Note**: Test files (`.spec.ts`) are currently at boilerplate/default state generated by Angular CLI. Custom test implementation is planned for future development.

### Code style

The project uses Prettier for code formatting. Config available in `package.json`.

"prettier": {
"printWidth": 100,
"singleQuote": true
}

---

## API Integration

This frontend connects to the [Remote Video Library Backend](https://github.com/anp3l/remote-video-server).

- JWT tokens are automatically attached to protected API requests via HTTP interceptor
- Authentication state is managed globally with RxJS BehaviorSubject
- All video operations are per-user isolated (users only see their own videos)
- Backend URL configured in `src/app/core/config/app.config.ts`

---

## Authentication Flow

1. User signs up or logs in via `/login` or `/signup` routes
2. Backend returns JWT token on successful authentication
3. Token is stored in localStorage
4. Auth interceptor automatically adds token to all API requests
5. Auth guard protects `/library` route from unauthenticated access
6. Token is validated on each request; expired tokens trigger logout

---

## Future Work

- Full-text search across video metadata
- Advanced filtering and sorting options
- Video playlists and collections
- User profile and settings page
- Video sharing capabilities
- Dark mode theme toggle
- Progressive Web App (PWA) support
- Drag-and-drop upload
- Batch operations (delete, edit multiple videos)
- Complete unit and integration test coverage
- E2E testing with Cypress or Playwright

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

Built by [Andrea](https://github.com/anp3l)  
Part of the **Remote Video Library** project suite

---

*Contributions and suggestions welcome!*


