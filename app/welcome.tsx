import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    BackHandler,
    Dimensions,
    Image,
    ImageSourcePropType,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AnimatedDots from '../components/AnimatedDots';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { markFirstTimeCompleted } from '../utils/firstTimeUser';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WelcomeStep {
  id: number;
  title: string;
  subtitle: string;
  image?: ImageSourcePropType;
  description: string;
  showAuthButtons?: boolean;
}

const welcomeSteps: WelcomeStep[] = [
  {
    id: 1,
    title: 'مرحبا بك !',
    subtitle: 'كل ما تحتاجة في عالم الطباعة\nفي مكان واحد',
    image: require('../assets/images/welcome_images/Group 18.png'),
    description: 'نوفر لك جميع خدمات الطباعة والتصميم بأعلى جودة وأفضل الأسعار'
  },
  {
    id: 2,
    title: 'معاك في\nأي مكان',
    subtitle: 'منتجك يصلك بأمان في أسرع وقت\nحتى باب المنزل',
    image: require('../assets/images/welcome_images/Group 19.png'),
    description: 'خدمة توصيل سريعة وآمنة لجميع أنحاء المملكة'
  },
  {
    id: 3,
    title: 'ابدأ رحلتك الآن',
    subtitle: 'سجل الدخول أو استمر كضيف لتصفح منتجاتنا',
    description: 'انضم إلينا لتجربة تسوق فريدة أو استكشف مجموعتنا الواسعة من المنتجات',
    showAuthButtons: true
  }
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = useCallback((direction: 'next' | 'prev') => {
    // For RTL: next goes right-to-left (negative), prev goes left-to-right (positive)
    const slideOutTo = direction === 'next' ? -screenWidth : screenWidth;
    const slideInFrom = direction === 'next' ? screenWidth : -screenWidth;

    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: slideOutTo,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change step
      if (direction === 'next') {
        setCurrentStep((prev) => prev + 1);
      } else {
        setCurrentStep((prev) => prev - 1);
      }

      // Set initial position for slide in (from opposite direction)
      slideAnim.setValue(slideInFrom);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      animateTransition('next');
    }
  };

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      animateTransition('prev');
    }
  }, [currentStep, animateTransition]);

  const handleSignup = async () => {
    // Mark first-time experience as completed
    await markFirstTimeCompleted();
    router.push('/signup');
  };

  const handleGuestContinue = async () => {
    try {
      // Mark first-time experience as completed
      await markFirstTimeCompleted();
      // Navigate to main tabs as guest
      router.replace('/(tabs)');
    } catch (error) {
      // Still navigate even if there's an error
      router.replace('/(tabs)');
    }
  };


  const currentStepData = welcomeSteps[currentStep];
  const isLastStep = currentStep === welcomeSteps.length - 1;

  // Handle physical back button
  useEffect(() => {
    const backAction = () => {
      if (currentStep > 0) {
        handlePrev();
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior (exit app)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [currentStep, handlePrev]);

  return (
    <SafeAreaWrapper backgroundColor={BRAND_COLORS.background.primary}>


      {/* Main Content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View 
          style={[
            styles.stepContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateX: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{currentStepData.title}</Text>
            <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
          </View>

          {/* Image Section */}
          {currentStepData.image && (
            <View style={styles.imageContainer}>
              <Image 
                source={currentStepData.image} 
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Description Section */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{currentStepData.description}</Text>
          </View>

          {/* Auth Buttons Section (Only on last step) */}
          {currentStepData.showAuthButtons && (
            <View style={styles.authButtonsContainer}>
              <TouchableOpacity 
                style={styles.startButton}
                onPress={handleSignup}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>ابدأ الآن</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.guestButton}
                onPress={handleGuestContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.guestButtonText}>متابعة كضيف</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Section */}
      {!isLastStep && (
        <View style={styles.bottomSection}>
          {/* Progress Dots */}
          <AnimatedDots
            count={welcomeSteps.length - 1}
            activeIndex={currentStep}
            dotColor={BRAND_COLORS.gray[300]}
            activeDotColor={BRAND_COLORS.primary}
            dotSize={10}
            activeDotSize={30}
            duration={350}
            gap={8}
            style={styles.dotsContainer}
          />

          {/* Next Button */}
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>التالي</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    minHeight: 60,
  },
  backButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: BRAND_COLORS.background.secondary,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  skipButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: BRAND_COLORS.background.secondary,
  },
  skipButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING['2xl'],
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    paddingTop: SPACING['6xl'],
    minHeight: screenHeight * 0.7,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING['4xl'],
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontFamily: TYPOGRAPHY.fontFamily.extraBold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize['4xl'] * TYPOGRAPHY.lineHeight.tight,
    marginBottom: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.lg * TYPOGRAPHY.lineHeight.normal,
    paddingHorizontal: SPACING.lg,
  },
  imageContainer: {
    width: screenWidth * 1,
    height: screenHeight * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  descriptionContainer: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING['4xl'],
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
    paddingHorizontal: SPACING.md,
  },
  authButtonsContainer: {
    width: '100%',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  startButton: {
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  startButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.white,
    textAlign: 'center',
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['2xl'],
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.primary,
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['4xl'],
    paddingTop: SPACING.lg,
  },
  dotsContainer: {
    marginBottom: SPACING['2xl'],
  },
  nextButton: {
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  nextButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.white,
    textAlign: 'center',
  },
});