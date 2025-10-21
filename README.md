# Maytech & AKQA Onboarding System

A comprehensive employee onboarding platform for new staff joining the Maytech and AKQA partnership in Sri Lanka.

## Overview

This application provides a complete onboarding solution with staff authentication, sequential learning modules, progress tracking, and administrative oversight. New employees must go through each section and acknowledge their understanding before proceeding to the next.

## Features

### For Staff
- **Secure Login**: Individual staff accounts with secure authentication
- **Sequential Learning**: Navigate through 7 comprehensive onboarding sections
- **Progress Tracking**: Visual progress indicator showing completion status
- **Acknowledgment System**: Must acknowledge understanding of each section before proceeding
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Session Persistence**: Resume where you left off

### For Administrators
- **Admin Dashboard**: Real-time overview of all staff onboarding progress
- **User Management**: Create new staff accounts
- **Progress Monitoring**: Track completion status and dates
- **Statistics**: View overall completion metrics
- **Comprehensive Reporting**: Detailed progress breakdown per employee

## Onboarding Sections

1. **Partnership** - Understanding the Maytech & AKQA collaboration
2. **FAQ** - Answers to common questions about payroll, leave, and HR
3. **Policies & Procedures** - Hybrid work, leave policies, and security guidelines
4. **Responsibilities** - Clear breakdown of who handles what
5. **Workflows** - Standard procedures for requests and support
6. **Workplace Guidelines** - Confidentiality, professionalism, and wellbeing
7. **Completion** - Congratulations and next steps

## Technologies Used

### Backend
- **Node.js** with **Express**: RESTful API and session management
- **bcryptjs**: Secure password hashing
- **express-session**: User authentication and session persistence
- **JSON File Storage**: Lightweight data persistence for users and progress

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with flexbox and grid layouts
- **Vanilla JavaScript**: No frameworks - fast and lightweight

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd maytech-akqa-onboarding
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

## Default Credentials

### Admin Account
- **Email**: admin@maytech.com
- **Password**: admin123

### Demo Staff Account
- **Email**: staff@maytech.com
- **Password**: staff123

**Note**: Change these credentials in production!

## File Structure

```
maytech-akqa-onboarding/
├── server.js                 # Express server with authentication
├── package.json              # Dependencies and scripts
├── .gitignore               # Git ignore rules
├── README.md                # This file
├── data/                    # Data directory (auto-created)
│   ├── users.json          # User accounts
│   └── progress.json       # Progress tracking
└── public/                  # Static files served by Express
    ├── login.html          # Login page
    ├── onboarding.html     # Staff onboarding interface
    ├── admin.html          # Admin dashboard
    ├── onboarding.js       # Onboarding logic
    ├── admin.js            # Admin dashboard logic
    ├── styles.css          # Original styles
    └── onboarding-styles.css  # Onboarding-specific styles
```

## Usage

### For Staff Members

1. **Login**: Use your credentials provided by HR
2. **Read Each Section**: Carefully review the onboarding content
3. **Acknowledge**: Check the box and click "Acknowledge & Continue"
4. **Progress**: The system automatically saves your progress
5. **Resume**: You can logout and resume later from where you left off

### For Administrators

1. **Login**: Use admin credentials
2. **Dashboard**: View real-time statistics and progress overview
3. **Monitor Progress**: See which staff have completed onboarding
4. **Add Users**: Create new staff accounts from the dashboard
5. **Track Details**: View completion dates and percentages

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/session` - Check current session

### Progress (Staff)
- `GET /api/progress` - Get current user's progress
- `POST /api/progress` - Update section acknowledgment

### Admin
- `GET /api/admin/progress` - Get all staff progress
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user

## Security Considerations

- Passwords are hashed using bcrypt
- Session-based authentication with secure cookies
- User data stored in JSON files (consider database for production)
- Admin-only endpoints protected with role-based middleware
- Input validation on all forms

## Production Deployment

For production use:

1. **Change Default Credentials**: Update admin and demo user passwords
2. **Use HTTPS**: Enable secure cookies in session config
3. **Environment Variables**: Store sensitive config in `.env` file
4. **Database**: Consider migrating from JSON to PostgreSQL/MongoDB
5. **Backup**: Implement regular backups of `data/` directory
6. **Monitoring**: Add logging and error tracking
7. **Rate Limiting**: Implement API rate limiting for security

## Customization

### Branding
Edit CSS variables in `public/onboarding-styles.css`:

```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    --success-color: #10b981;
    /* ... customize colors */
}
```

### Content
Update section content in `public/onboarding.html`

### Number of Sections
Modify `totalSections` variable in `public/onboarding.js` and `public/admin.js`

## Troubleshooting

**Port already in use**
```bash
# Change port in server.js or set PORT environment variable
PORT=3001 npm start
```

**Cannot access after login**
- Clear browser cookies
- Check browser console for errors
- Verify session secret is set

**Progress not saving**
- Check `data/` directory permissions
- Verify `progress.json` exists
- Check server logs for errors

## Future Enhancements

- Email notifications for incomplete onboarding
- Certificate generation upon completion
- Quiz/assessment integration
- Multi-language support
- Mobile app version
- Integration with HR systems (BetterHR)
- Video content support
- PDF export of progress reports

## Credits

Created for the Maytech & AKQA partnership based on official onboarding materials.

## License

© 2025 Maytech & AKQA. All rights reserved.

## Support

For technical issues, please contact:
- **System Administrator**: system@maytech.com
- **HR Inquiries**: Maytech HR Manager
- **General Questions**: Director of Engineering and Technology
