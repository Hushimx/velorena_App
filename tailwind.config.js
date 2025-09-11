/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,jsx,ts,tsx}",
      "./components/**/*.{js,jsx,ts,tsx}",
      "./screens/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
      extend: {
        colors: {
          // Brand Colors - Primary palette
          brand: {
            yellow: '#ffde9f',        // Main brand yellow
            'yellow-dark': '#f5d182', // Darker yellow variant
            brown: '#2a1e1e',        // Main brand brown/dark
            'brown-light': '#3a2e2e', // Lighter brown variant
          },
          
          // Text Colors
          text: {
            primary: '#2a1e1e',      // Main text color (brown)
            secondary: '#9CA3AF',    // Gray text
            light: '#ffffff',        // White text
            muted: '#6B7280',        // Muted text
          },
          
          // Background Colors
          bg: {
            primary: '#ffffff',      // White background
            secondary: '#ffde9f',    // Yellow background
            'secondary-dark': '#f5d182', // Darker yellow background
            card: '#ffffff',         // Card background
            overlay: 'rgba(0,0,0,0.1)', // Overlay background
          },
          
          // Border Colors
          border: {
            primary: '#ffde9f',      // Yellow border
            secondary: '#e5e7eb',    // Light gray border
            dark: '#2a1e1e',         // Dark border
            input: '#ffde9f',        // Input border
          },
          
          // Button Colors
          button: {
            primary: '#2a1e1e',      // Primary button (brown)
            'primary-hover': '#3a2e2e', // Primary button hover
            secondary: '#ffffff',    // Secondary button (white)
            disabled: '#9ca3af',     // Disabled button
            'social-google': '#DB4437', // Google button
            'social-facebook': '#1877F2', // Facebook button
          },
          
          // Status Colors
          status: {
            success: '#10B981',      // Success green
            error: '#b91c1c',        // Error red
            warning: '#F59E0B',      // Warning orange
            info: '#3B82F6',         // Info blue
          },
          
          // Promo/Special Colors
          promo: {
            green: '#70F8A4FF',      // Promo green
            blue: '#87ADFDFF',       // Promo blue
            yellow: '#ffde9f',       // Promo yellow
          },
          
          // Shadow Colors
          shadow: {
            light: 'rgba(0,0,0,0.05)', // Light shadow
            medium: 'rgba(0,0,0,0.1)',  // Medium shadow
            dark: 'rgba(0,0,0,0.2)',    // Dark shadow
          }
        },
        
        // Custom spacing for your app
        spacing: {
          '18': '4.5rem',   // 72px
          '88': '22rem',    // 352px
        },
        
        // Custom border radius
        borderRadius: {
          'xl': '1rem',     // 16px
          '2xl': '1.5rem',  // 24px
        },
        
        // Custom font families (matching your app)
        fontFamily: {
          'arabic-regular': ['NotoSansArabic_400Regular'],
          'arabic-medium': ['NotoSansArabic_500Medium'],
          'arabic-semibold': ['NotoSansArabic_600SemiBold'],
          'arabic-bold': ['NotoSansArabic_700Bold'],
          'arabic-extrabold': ['NotoSansArabic_800ExtraBold'],
        },
      },
    },
    plugins: [],
  }
  