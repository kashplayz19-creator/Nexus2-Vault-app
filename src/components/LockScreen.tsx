import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Unlock, Zap, Fingerprint, Cpu, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [passkey, setPasskey] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const [bioFailures, setBioFailures] = useState(0);
  const [isBioActive, setIsBioActive] = useState(false);
  const [isBioDisabled, setIsBioDisabled] = useState(false);

  const CORRECT_PASSKEY = '1926'; // Futuristic default code

  const sequences = [
    '[SYSTEM_BOOT]: INITIALIZING KERNEL...',
    '[QUANTUM_LINK]: ESTABLISHED',
    '[HARDWARE]: PIXEL_10_SECURE_ENCLAVE_DETECTED',
    '[NEURAL_VAULT]: ENCRYPTION_ACTIVE',
    '[SECURITY]: STANDBY FOR BIOMETRIC_HANDSHAKE'
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < sequences.length) {
        setBootSequence(prev => [...prev, sequences[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = (num: string) => {
    if (passkey.length < 4) {
      setPasskey(prev => prev + num);
      setIsError(false);
    }
  };

  const handleClear = () => setPasskey('');

  const handleSubmit = () => {
    if (passkey === CORRECT_PASSKEY) {
      setIsSuccess(true);
      setTimeout(() => onUnlock(), 1000);
    } else {
      setIsError(true);
      setPasskey('');
      // Haptic feedback simulation
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(200);
    }
  };

  const handleBiometricAuth = async () => {
    if (isBioDisabled || isSuccess) return;

    try {
      setIsBioActive(true);
      
      // Check if WebAuthn is supported
      if (typeof window !== 'undefined' && !window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported');
      }

      // Check for hardware authenticator (Pixel 10 specific logic)
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        toast.error("Biometric Hardware missing. Falling back to PIN.");
        throw new Error('Biometric hardware not available');
      }

      // WebAuthn request as per instructions
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const savedCredId = localStorage.getItem('nexus_passkey_credential');
      
      if (!savedCredId) {
        // Registration Flow
        const registerOptions: any = {
          publicKey: {
            challenge: challenge,
            rp: { name: "Nexus Vault", id: window.location.hostname || "localhost" },
            user: { 
              id: new Uint8Array(16), 
              name: "nexus_user@vault.internal", 
              displayName: "Nexus Operator" 
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
            timeout: 60000,
            attestation: "none",
            userVerification: "required",
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
              residentKey: "required"
            }
          }
        };

        const credential: any = await navigator.credentials.create(registerOptions);
        if (credential) {
          localStorage.setItem('nexus_passkey_credential', credential.id);
          toast.success("Biometric Link Established.");
        }
      } else {
        // Authentication Flow
        const authOptions: any = {
          publicKey: {
            challenge: challenge,
            timeout: 60000,
            userVerification: 'required',
            rpId: window.location.hostname || 'localhost',
            allowCredentials: [{
              id: Uint8Array.from(atob(savedCredId.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
              type: 'public-key'
            }]
          }
        };

        await navigator.credentials.get(authOptions);
      }
      
      // If we got here without error (in a real scenario we'd verify the credential)
      setIsSuccess(true);
      setIsBioActive(false);
      setTimeout(() => onUnlock(), 1000);
      
    } catch (err: any) {
      console.warn('Biometric error:', err);
      setIsBioActive(false);
      
      const newFailures = bioFailures + 1;
      setBioFailures(newFailures);
      
      if (newFailures >= 3) {
        setIsBioDisabled(true);
        setIsError(true);
        setTimeout(() => setIsError(false), 2000);
      } else {
        setIsError(true);
        setTimeout(() => setIsError(false), 1000);
      }
      
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
    }
  };

  useEffect(() => {
    if (passkey.length === 4) {
      handleSubmit();
    }
  }, [passkey]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0b0e14] flex items-center justify-center overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      {/* Neural Purple Pulse Ring for Biometrics */}
      <AnimatePresence>
        {isBioActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0, 0.5, 0],
              scale: [0.8, 1.2, 1.5],
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-[300px] h-[300px] rounded-full border-[8px] border-[#8B5CF6]/40 shadow-[0_0_50px_#8B5CF6]" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-8">
          <motion.div 
             animate={{ 
               boxShadow: isError ? '0 0 30px #f43f5e' : isSuccess ? '0 0 40px #10b981' : '0 0 20px rgba(16, 185, 129, 0.2)'
             }}
             className={`w-20 h-20 rounded-2xl neu-embossed flex items-center justify-center mb-4 border border-emerald-500/20`}
          >
            <Shield className={`w-10 h-10 ${isError ? 'text-rose-500' : isSuccess ? 'text-emerald-500' : 'text-emerald-400'} transition-colors duration-300`} />
          </motion.div>
          <h1 className="text-2xl font-black tracking-tighter text-white">NEXUS<span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-4">VAULT</span></h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-[0.3em]">Protocol_v4.0.4_Secure</p>
          </div>
        </div>

        {/* MAIN LOCK CARD */}
        <div className={`relative p-8 rounded-[40px] glass-panel border transition-all duration-500 ${isError ? 'border-rose-500/50' : 'border-emerald-500/30'} group shadow-2xl`}>
          {/* Glowing Border Hook */}
          <div className={`absolute inset-0 rounded-[40px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none ${isError ? 'shadow-[0_0_50px_-12px_#f43f5e]' : 'shadow-[0_0_60px_-12px_#10b981]'}`} />

          {/* DIAGNOSTIC BOOT OUTPUT */}
          <div className="mb-8 p-3 neu-sunken rounded-xl bg-black/40 border border-white/5 min-h-[80px]">
            <div className="flex flex-col gap-1">
              {bootSequence.map((line, idx) => (
                <motion.p 
                  key={idx}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[8px] font-mono text-emerald-500/80 tracking-widest leading-none"
                >
                  {line}
                </motion.p>
              ))}
              {bootSequence.length === sequences.length && !isSuccess && !isError && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-[9px] font-mono text-zinc-400 animate-pulse uppercase"
                >
                  &gt; ENTER_PASSKEY_TO_DECRYPT
                </motion.div>
              )}
              {isError && (
                <p className="text-[9px] font-mono text-rose-500 uppercase mt-2 animate-bounce">
                  {bioFailures >= 3 ? '[!] BIOMETRIC_LOCKED_USE_PIN' : '[!] ACCESS_DENIED_AUTH_FAIL'}
                </p>
              )}
              {isBioActive && (
                <div className="flex flex-col gap-2 mt-2">
                  <p className="text-[9px] font-mono text-[#8B5CF6] uppercase animate-pulse">
                    {localStorage.getItem('nexus_passkey_credential') ? '[&gt;] AWAITING_BIOMETRIC_HANDSHAKE...' : '[&gt;] LINKING_BIOMETRICS_VAULT_INIT...'}
                  </p>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-8 h-1 bg-[#8B5CF6]/40 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              )}
              {isSuccess && (
                <p className="text-[9px] font-mono text-emerald-500 uppercase mt-2 animate-pulse">[✓] AUTH_SUCCESS_DECRYPTING...</p>
              )}
            </div>
          </div>

          {/* PASSKEY INDICATORS */}
          <div className="flex justify-center gap-4 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: passkey.length > i ? 1.2 : 1,
                  backgroundColor: passkey.length > i ? (isError ? '#f43f5e' : '#10b981') : 'rgba(255,255,255,0.05)',
                  boxShadow: passkey.length > i ? (isError ? '0 0 15px #f43f5e' : '0 0 15px #10b981') : 'none'
                }}
                className="w-10 h-10 rounded-xl neu-sunken transition-all duration-200"
              />
            ))}
          </div>

          {/* NUMPAD */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                disabled={isSuccess}
                className="w-full aspect-square neu-button rounded-2xl flex items-center justify-center text-lg font-black text-zinc-300 hover:text-emerald-400 active:scale-95 transition-all disabled:opacity-50"
              >
                {num}
              </button>
            ))}
            <button
               onClick={handleClear}
               className="aspect-square neu-button rounded-2xl flex items-center justify-center text-[10px] font-black text-zinc-600 hover:text-rose-400 uppercase tracking-widest"
            >
              CLR
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              disabled={isSuccess}
              className="aspect-square neu-button rounded-2xl flex items-center justify-center text-lg font-black text-zinc-300 hover:text-emerald-400 disabled:opacity-50"
            >
              0
            </button>
            <button
               onClick={handleSubmit}
               className="aspect-square neu-button rounded-2xl flex items-center justify-center text-emerald-400 hover:text-emerald-300"
            >
              {isSuccess ? <ShieldCheck className="w-6 h-6 animate-pulse" /> : <Shield className="w-6 h-6" />}
            </button>
          </div>

          <div className="flex flex-col gap-4 text-center">
             <div className="flex items-center gap-4 py-2">
               <div className="h-[1px] flex-1 bg-white/5" />
               <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.4em]">Biometric Backup</span>
               <div className="h-[1px] flex-1 bg-white/5" />
             </div>
             <button 
               onClick={handleBiometricAuth}
               disabled={isBioDisabled || isSuccess}
               className={`flex items-center justify-center gap-3 py-4 neu-button rounded-2xl group/bio transition-all ${
                 isBioDisabled ? 'opacity-20 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
               }`}
             >
               <Fingerprint className={`w-5 h-5 transition-colors ${
                 isBioActive ? 'text-[#8B5CF6] animate-pulse' : 'text-emerald-500/40 group-hover/bio:text-emerald-500'
               }`} />
               <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                 isBioActive ? 'text-[#8B5CF6]' : 'text-zinc-500 group-hover/bio:text-white'
               }`}>
                 {isBioDisabled ? 'Biometrics Disabled' : 'Neural Fingerprint Link'}
               </span>
             </button>
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="mt-12 flex flex-col items-center gap-6 opacity-40">
           <div className="grid grid-cols-2 gap-8 w-full">
             <div className="p-3 neu-sunken rounded-xl flex items-center gap-3">
               <Cpu className="w-4 h-4 text-emerald-500" />
               <div>
                  <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest leading-none">Kernel_Auth</p>
                  <p className="text-[10px] font-bold text-white mt-0.5">QuantumEnc</p>
               </div>
             </div>
             <div className="p-3 neu-sunken rounded-xl flex items-center gap-3">
               <Zap className="w-4 h-4 text-emerald-500" />
               <div>
                  <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest leading-none">LinkStat</p>
                  <p className="text-[10px] font-bold text-white mt-0.5">Encrypted</p>
               </div>
             </div>
           </div>
           
           <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-700">Property of Nexus Intelligence • 2026</p>
        </div>
      </motion.div>

      {/* Unlock Animation Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[10000] bg-emerald-500 pointer-events-none mix-blend-overlay"
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
