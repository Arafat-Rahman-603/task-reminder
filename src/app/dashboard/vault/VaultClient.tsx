"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, Copy, Plus, Trash2, ShieldCheck, KeyRound, Eye, EyeOff, X, Key, Mail, ShieldAlert } from "lucide-react";
import { encryptData, decryptData } from "@/lib/crypto";
import { createVaultItem, deleteVaultItem } from "@/actions/vault.actions";
import { uploadVaultImage } from "@/actions/cloudinary.actions";
import { setupVaultPassword, unlockVault, verifyCustomPassword, resetCustomPassword, resetVaultPassword } from "@/actions/vault.auth";
import { useRouter } from "next/navigation";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";

type VaultField = {
  id: string;
  name: string;
  type: 'text' | 'password' | 'textarea' | 'number';
  value: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function VaultClient({ initialItems, vaultSettings }: { initialItems: any[], vaultSettings?: any }) {
  const router = useRouter();
  
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [isInitialized, setIsInitialized] = useState(vaultSettings?.isInitialized || false);
  // Setup State
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  
  // Add Secret State
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Login");
  const [fields, setFields] = useState<VaultField[]>([
    { id: '1', name: 'Username', type: 'text', value: '' },
    { id: '2', name: 'Password', type: 'password', value: '' }
  ]);
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attachments, setAttachments] = useState<any[]>([]);
  const [customPassword, setCustomPassword] = useState("");
  
  // Decrypt Modal State
  const [activeItem, setActiveItem] = useState<any>(null);
  const [itemPasswordInput, setItemPasswordInput] = useState("");
  const [decryptedContent, setDecryptedContent] = useState<any>(null);
  const [decryptError, setDecryptError] = useState("");
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  
  // Reset Password State
  const [isResettingCustom, setIsResettingCustom] = useState(false);
  const [customResetStep, setCustomResetStep] = useState(1);
  const [customOtpCode, setCustomOtpCode] = useState("");
  const [newCustomPassword, setNewCustomPassword] = useState("");
  const [resetAccountPassword, setResetAccountPassword] = useState("");
  
  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const maxAttempts = vaultSettings?.maxFailedAttempts || 3;
  const lockoutSeconds = vaultSettings?.lockoutDurationSeconds || 30;
  const selfDestructAttempts = vaultSettings?.selfDestructAttempts || 0;
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingLockoutTime, setRemainingLockoutTime] = useState(0);
  const [copiedField, setCopiedField] = useState("");

  useEffect(() => {
    let interval: any;
    if (lockoutEndTime) {
      interval = setInterval(() => {
        const now = Date.now();
        if (now >= lockoutEndTime) {
          setLockoutEndTime(null);
          setFailedAttempts(0);
          setRemainingLockoutTime(0);
          clearInterval(interval);
        } else {
          setRemainingLockoutTime(Math.ceil((lockoutEndTime - now) / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  // --- SETUP VAULT ---
  const handleSetupVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (setupPassword !== setupConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (setupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await setupVaultPassword(setupPassword);
      if (res.success) {
        setIsInitialized(true);
        
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to setup vault");
      }
    } catch (err) {
      setErrorMsg("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // --- ADD SECRET ---
  // Attachment handling via AttachmentUpload component


  const handleAddSecretClick = () => {
    setIsAdding(true);
  };

  const addField = () => setFields([...fields, { id: Date.now().toString(), name: '', type: 'text', value: '' }]);
  const removeField = (id: string) => setFields(fields.filter(f => f.id !== id));
  const updateField = (id: string, key: keyof VaultField, value: string) => setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));

  const handleCreateSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (useCustomPassword && !customPassword) {
      alert("Please provide a custom password.");
      return;
    }
    setLoading(true);
    try {
      const cleanFields = fields.filter(f => f.name.trim() !== "");
      const secretObject = { fields: cleanFields };
      const plaintext = JSON.stringify(secretObject);
      
      const res = await createVaultItem({
        title: newItemTitle,
        category: newItemCategory,
        encryptedData: "placeholder",
        iv: "placeholder",
        salt: "placeholder",
        isCustomPassword: useCustomPassword,
        customPasswordPlaintext: useCustomPassword ? customPassword : undefined,
        plaintextData: plaintext,
        attachments: attachments.length > 0 ? attachments : undefined
      } as any);

      if (res.success) {
        setItems([res.item, ...items]);
        setIsAdding(false);
        setNewItemTitle("");
        setFields([{ id: '1', name: 'Username', type: 'text', value: '' }, { id: '2', name: 'Password', type: 'password', value: '' }]);
        setCustomPassword("");
        setUseCustomPassword(false);
        setAttachments([]);
        router.refresh();
      } else {
        alert(res.error);
      }
    } catch (err) {
      alert("Failed to encrypt data.");
    } finally {
      setLoading(false);
    }
  };

  // --- VIEW ITEM CLICK ---
  const handleViewItemClick = (item: any) => {
    setDecryptedContent(null);
    setItemPasswordInput("");
    setDecryptError("");
    setIsResettingCustom(false);
    setCustomResetStep(1);
    setResetAccountPassword("");

    setActiveItem(item);
  };

  // --- DECRYPT ITEM ---
  const handleDecryptItem = async (e?: React.FormEvent, itemToDecrypt?: any, providedVaultKey?: string) => {
    if (e) e.preventDefault();
    if (lockoutEndTime) return;
    setDecryptError("");
    setLoading(true);
    
    const targetItem = itemToDecrypt || activeItem;
    if (!targetItem) return;
    
    try {
      let activeVaultKey = providedVaultKey;

      if (targetItem.isCustomPassword) {
        // Verify custom password with server
        const res = await verifyCustomPassword(targetItem._id, itemPasswordInput);
        if (!res.success) throw new Error("Incorrect custom password");
        activeVaultKey = res.vaultKey; 
      } else {
        if (!activeVaultKey) {
          const res = await unlockVault(itemPasswordInput);
          if (!res.success) throw new Error("Incorrect vault password");
          activeVaultKey = res.vaultKey;
          
        }
      }

      if (!activeVaultKey) throw new Error("No vault key available");

      // Decrypt using the vault key
      const jsonStr = await decryptData(
        targetItem.encryptedData,
        targetItem.iv,
        targetItem.salt,
        activeVaultKey
      );
      setDecryptedContent(JSON.parse(jsonStr));
      setFailedAttempts(0);
    } catch (err: any) {
      if (err.message === "No vault key available") return;
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (selfDestructAttempts > 0 && newAttempts >= selfDestructAttempts) {
        await deleteVaultItem(targetItem._id);
        setItems(items.filter(i => i._id !== targetItem._id));
        setActiveItem(null);
        setDecryptError("");
        setFailedAttempts(0);
        return;
      }
      
      if (newAttempts >= maxAttempts) {
        setLockoutEndTime(Date.now() + lockoutSeconds * 1000);
        setRemainingLockoutTime(lockoutSeconds);
        setDecryptError(`Locked for ${lockoutSeconds} seconds.`);
      } else {
        setDecryptError(err.message === "Incorrect custom password" ? "Incorrect custom password." : `Incorrect password. ${selfDestructAttempts > 0 ? (selfDestructAttempts - newAttempts) + ' attempts until destruction.' : (maxAttempts - newAttempts) + ' attempts remaining.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- MOCK RESET CUSTOM PASSWORD ---
  const handleSendCustomOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCustomResetStep(2);
    }, 1000);
  };

  const handleResetCustomPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecryptError("");
    if (customOtpCode !== "123456") {
      setDecryptError("Invalid OTP Code. (Hint: use 123456)");
      return;
    }
    if (!resetAccountPassword) {
      setDecryptError("Website account password is required.");
      return;
    }
    setLoading(true);
    try {
      let res;
      if (activeItem.isCustomPassword) {
        res = await resetCustomPassword(activeItem._id, customOtpCode, resetAccountPassword, newCustomPassword);
      } else {
        res = await resetVaultPassword(customOtpCode, resetAccountPassword, newCustomPassword);
      }
      
      if (res.success) {
        setIsResettingCustom(false);
        setCustomResetStep(1);
        setItemPasswordInput(newCustomPassword);
        if (!activeItem.isCustomPassword) {
           
        }
        await handleDecryptItem(undefined, activeItem, res.vaultKey);
      } else {
        setDecryptError(res.error || "Failed to reset password.");
      }
    } catch (err) {
      setDecryptError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (item: any) => {
    setItemToDelete(item);
    setDeletePasswordInput("");
    setDeleteError("");
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");
    setLoading(true);

    try {
      if (itemToDelete.isCustomPassword) {
        const res = await verifyCustomPassword(itemToDelete._id, deletePasswordInput);
        if (!res.success) throw new Error("Invalid custom password");
      } else {
        const res = await unlockVault(deletePasswordInput);
        if (!res.success) {
          throw new Error("Invalid vault password");
        }
      }
      
      const res = await deleteVaultItem(itemToDelete._id);
      if (res.success) {
        setItems(items.filter(i => i._id !== itemToDelete._id));
        setItemToDelete(null);
        router.refresh();
      }
    } catch (err) {
      setDeleteError("Incorrect password. Deletion denied.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RENDER ---------------- //

  if (!isInitialized) {
    return (
      <div className="w-full max-w-lg mx-auto mt-10 p-8 bg-surface-container-low border border-surface-variant/40 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-stitch-primary/10 text-stitch-primary rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface">Setup Vault Pin / Password</h2>
          <p className="text-sm text-on-surface-variant mt-2">Set a master password to lock your vault items. You can reset this password via Email OTP from Settings if you forget it.</p>
        </div>
        
        <form onSubmit={handleSetupVault} className="space-y-4" method="POST">
          {errorMsg && <div className="text-xs text-error bg-error/10 p-3 rounded-xl">{errorMsg}</div>}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Create Vault Password</label>
            <input required type="password" value={setupPassword} onChange={e => setSetupPassword(e.target.value)} className="w-full px-4 py-3 bg-surface-container border border-surface-variant/50 rounded-xl text-sm focus:border-stitch-primary focus:outline-none focus:ring-1 focus:ring-stitch-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Confirm Password</label>
            <input required type="password" value={setupConfirmPassword} onChange={e => setSetupConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-surface-container border border-surface-variant/50 rounded-xl text-sm focus:border-stitch-primary focus:outline-none focus:ring-1 focus:ring-stitch-primary" />
          </div>
          <button type="submit" disabled={loading} className="w-full mt-4 py-3 bg-stitch-primary text-on-primary font-bold rounded-xl hover:bg-primary-fixed transition-colors disabled:opacity-50">
            {loading ? "Saving..." : "Lock Vault"}
          </button>
        </form>
      </div>
    );
  }

  // --- VAULT DASHBOARD (Always Visible) ---
  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-headline text-on-surface">Secure Vault</h1>
            <p className="text-sm text-on-surface-variant mt-1">End-to-End Encrypted personal secrets</p>
          </div>
<button 
          onClick={handleAddSecretClick}
          className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl bg-stitch-primary text-on-primary font-bold text-sm shadow-[0_0_20px_rgba(125,211,252,0.25)] hover:bg-primary-fixed transition-all"
        >
          <Plus className="w-[18px] h-[18px]" />
          <span>New Secret</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item._id} className="p-5 rounded-2xl bg-surface-container-low border border-surface-variant/40 shadow-sm relative group overflow-hidden cursor-pointer hover:border-stitch-primary/50 transition-colors" onClick={() => handleViewItemClick(item)}>
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-surface-variant/20 rounded-full blur-xl"></div>
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.isCustomPassword ? 'bg-warning/10 text-warning' : 'bg-surface-variant/50 text-on-surface-variant'}`}>
                  {item.isCustomPassword ? <Key className="w-4 h-4"/> : <KeyRound className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-base truncate max-w-[150px]">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-on-surface-variant">{item.category}</p>
                    {item.isCustomPassword && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-warning/20 text-warning">Custom Pass</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); confirmDelete(item); }} className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && !isAdding && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container-low/50 rounded-3xl border border-dashed border-surface-variant">
            <ShieldCheck className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">Your vault is empty.</p>
            <p className="text-xs mt-1">Click 'New Secret' to get started.</p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface border border-surface-variant/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-surface-variant/40 flex justify-between items-center bg-surface-container-low/50">
              <div>
                <h2 className="text-xl font-bold text-on-surface mb-1">Add Secret</h2>
                <p className="text-xs text-on-surface-variant">Data is securely encrypted.</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-variant/20"><X className="w-5 h-5" /></button>
            </div>
            
            <form id="vault-form" onSubmit={handleCreateSecret} className="p-5 space-y-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent" method="POST">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Title (App/Website)</label>
                <input required type="text" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:border-stitch-primary focus:outline-none" placeholder="e.g. Google Account" />
              </div>

              {/* Dynamic Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface-variant block">Secret Fields</label>
                  <button type="button" onClick={addField} className="text-[11px] font-bold text-stitch-primary hover:text-primary-fixed flex items-center gap-1"><Plus className="w-3 h-3" /> Add Field</button>
                </div>
                
                {fields.map((field) => (
                  <div key={field.id} className="flex flex-col gap-2 p-3 bg-surface-container-low border border-surface-variant/30 rounded-xl relative group">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={field.name} 
                        onChange={e => updateField(field.id, 'name', e.target.value)} 
                        placeholder="Field Name" 
                        className="flex-1 px-3 py-2 bg-surface-container border border-surface-variant/50 rounded-lg text-sm focus:outline-none focus:border-stitch-primary"
                      />
                      <select 
                        value={field.type} 
                        onChange={e => updateField(field.id, 'type', e.target.value as any)}
                        className="w-[110px] px-2 py-2 bg-surface-container border border-surface-variant/50 rounded-lg text-sm focus:outline-none focus:border-stitch-primary"
                      >
                        <option value="text">Text</option>
                        <option value="password">Password</option>
                        <option value="number">Number</option>
                        <option value="textarea">Notes</option>
                      </select>
                      <button type="button" onClick={() => removeField(field.id)} className="p-2 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {field.type === 'textarea' ? (
                      <textarea 
                        value={field.value} 
                        onChange={e => updateField(field.id, 'value', e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container border border-surface-variant/50 rounded-lg text-sm focus:outline-none focus:border-stitch-primary min-h-[60px]"
                        placeholder="Value..."
                      />
                    ) : (
                      <input 
                        type={field.type === 'password' ? 'password' : 'text'} 
                        value={field.value} 
                        onChange={e => updateField(field.id, 'value', e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container border border-surface-variant/50 rounded-lg text-sm focus:outline-none focus:border-stitch-primary"
                        placeholder="Value..."
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Attachments */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Attachments</label>
                <AttachmentUpload
                  multiple
                  folder="manageo/vault"
                  attachments={attachments}
                  onChange={setAttachments}
                  label="Upload documents or images"
                />
              </div>

              {/* Password Section */}
              <div className="p-4 bg-surface-variant/10 rounded-xl border border-surface-variant/30 space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={useCustomPassword} onChange={e => setUseCustomPassword(e.target.checked)} className="rounded border-surface-variant text-warning focus:ring-warning" />
                  <span className="text-sm font-medium text-on-surface">Use an isolated custom password for this item</span>
                </label>
                
                {useCustomPassword ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Custom Item Password</label>
                    <input required type="password" placeholder="Enter custom password" value={customPassword} onChange={e => setCustomPassword(e.target.value)} className="w-full px-4 py-2.5 bg-surface-container-low border border-warning/50 rounded-xl text-sm focus:border-warning focus:outline-none" />
                    <p className="text-[10px] text-warning mt-2 leading-tight">This password will only lock this item. You can reset it later via OTP if needed.</p>
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    This item will use your default Vault Password. You will only need to enter your Vault Password when you want to view this secret later.
                  </p>
                )}
              </div>
            </form>
            
            <div className="p-5 border-t border-surface-variant/40 flex justify-end gap-3 bg-surface-container-low/50">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface">Cancel</button>
              <button form="vault-form" type="submit" disabled={loading} className="px-6 py-2 bg-stitch-primary text-on-primary font-bold rounded-xl text-sm hover:bg-primary-fixed disabled:opacity-50">Save & Encrypt</button>
            </div>
          </div>
        </div>
      )}

      {/* Decrypt / View Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-surface border border-surface-variant/40 rounded-3xl shadow-2xl p-6 relative">
            <button onClick={() => { setActiveItem(null); setDecryptedContent(null); setIsResettingCustom(false); setCustomResetStep(1); }} className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface"><X className="w-5 h-5"/></button>
            
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeItem.isCustomPassword ? 'bg-warning/10 text-warning' : 'bg-stitch-primary/10 text-stitch-primary'}`}>
                {decryptedContent ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface max-w-[200px] truncate">{activeItem.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-on-surface-variant">{decryptedContent ? "Unlocked" : (isResettingCustom ? "Reset Password" : "Locked Securely")}</p>
                  {activeItem.isCustomPassword && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-warning/20 text-warning">Custom Pass</span>
                  )}
                </div>
              </div>
            </div>

            {!decryptedContent && !isResettingCustom && (
              <form onSubmit={handleDecryptItem} className="space-y-4" method="POST">
                {decryptError && <div className="text-xs text-error bg-error/10 p-2 rounded-lg leading-tight">{decryptError}</div>}
                {lockoutEndTime && (
                  <div className="text-xs text-error font-medium flex justify-center py-2 bg-error/10 rounded-lg animate-pulse">
                    Locked. Try again in {remainingLockoutTime}s
                  </div>
                )}
                <div>
                  <input autoFocus required type="password" placeholder={activeItem.isCustomPassword ? "Enter Custom Password" : "Enter Vault Password"} disabled={!!lockoutEndTime || loading} value={itemPasswordInput} onChange={e => setItemPasswordInput(e.target.value)} className="w-full px-4 py-3 bg-surface-container-low border border-warning/50 rounded-xl text-sm focus:border-warning focus:outline-none disabled:opacity-50" />
                </div>
                <button type="submit" disabled={loading || !!lockoutEndTime} className="w-full py-3 bg-warning text-warning-on font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-colors text-black">
                  {lockoutEndTime ? "Locked" : "Decrypt"}
                </button>
                <div className="text-center mt-2">
                  <button type="button" onClick={() => setIsResettingCustom(true)} className="text-[11px] font-medium text-on-surface-variant hover:text-warning">Forgot Password?</button>
                </div>
              </form>
            )}

            {!decryptedContent && isResettingCustom && (
              <div className="space-y-4">
                {customResetStep === 1 ? (
                  <form onSubmit={handleSendCustomOTP} className="space-y-4" method="POST">
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      We will send a verification code to your email to reset this password.
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsResettingCustom(false)} className="flex-1 py-2 text-on-surface-variant text-sm hover:bg-surface-variant/20 rounded-xl">Cancel</button>
                      <button type="submit" disabled={loading} className="flex-1 py-2 bg-warning text-warning-on font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 text-black">Send OTP</button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetCustomPasswordSubmit} className="space-y-4" method="POST">
                    {decryptError && <div className="text-xs text-error bg-error/10 p-2 rounded-lg leading-tight">{decryptError}</div>}
                    <div>
                      <input required type="text" placeholder="OTP Code (123456)" value={customOtpCode} onChange={e => setCustomOtpCode(e.target.value)} className="w-full px-4 py-2.5 bg-surface-container-low border border-warning/50 rounded-xl text-sm focus:border-warning focus:outline-none mb-3" />
                      <input required type="password" placeholder="Website Account Password" value={resetAccountPassword} onChange={e => setResetAccountPassword(e.target.value)} className="w-full px-4 py-2.5 bg-surface-container-low border border-warning/50 rounded-xl text-sm focus:border-warning focus:outline-none mb-3" />
                      <input required type="password" placeholder={activeItem.isCustomPassword ? "New Custom Password" : "New Vault Password"} value={newCustomPassword} onChange={e => setNewCustomPassword(e.target.value)} className="w-full px-4 py-2.5 bg-surface-container-low border border-warning/50 rounded-xl text-sm focus:border-warning focus:outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setIsResettingCustom(false); setCustomResetStep(1); }} className="flex-1 py-2 text-on-surface-variant text-sm hover:bg-surface-variant/20 rounded-xl">Cancel</button>
                      <button type="submit" disabled={loading} className="flex-1 py-2 bg-warning text-warning-on font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 text-black">Reset & Open</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {decryptedContent && (
              <div className="w-full">
                {activeItem.imageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-surface-variant/40 bg-surface-container-low">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeItem.imageId ? `/api/assets/${activeItem.imageId}?resourceType=image` : activeItem.imageUrl} alt="Secret Attachment" className="w-full h-auto object-contain max-h-48" />
                  </div>
                )}
                {activeItem.attachments && activeItem.attachments.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {activeItem.attachments.map((att: any, idx: number) => (
                        <a key={idx} href={att.publicId ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || 'auto'}` : att.url} target="_blank" rel="noopener noreferrer" className="block border border-surface-variant/40 rounded-xl overflow-hidden hover:border-stitch-primary transition-colors bg-surface-container-low w-24 h-24">
                          {att.resourceType === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={att.publicId ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || 'image'}` : att.url} alt={att.originalFilename || `Attachment ${idx}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-on-surface-variant hover:text-stitch-primary">
                              <span className="text-[10px] font-medium break-all line-clamp-2">{att.originalFilename || `File ${idx}`}</span>
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[60vh] overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
                {(decryptedContent.fields || []).map((field: VaultField) => (
                  <div key={field.id} className="p-3 bg-surface-container-low rounded-xl border border-surface-variant/40">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">{field.name}</p>
                    
                    {field.type === 'textarea' ? (
                      <p className="text-sm text-on-surface whitespace-pre-wrap">{field.value}</p>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <p className={`text-sm font-medium text-on-surface truncate ${field.type === 'password' || field.type === 'number' ? 'font-mono' : ''}`}>
                            {field.type === 'password' && !showPassword[field.id] ? 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢' : field.value}
                          </p>
                          {field.type === 'password' && (
                            <button type="button" onClick={() => setShowPassword(p => ({ ...p, [field.id]: !p[field.id] }))} className="text-on-surface-variant hover:text-on-surface shrink-0">
                              {showPassword[field.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                        <button onClick={() => handleCopy(field.value, field.id)} className="text-stitch-primary hover:text-primary-fixed shrink-0">
                          {copiedField === field.id ? <span className="text-xs font-bold text-success">Copied!</span> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
             </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-surface border border-surface-variant/40 rounded-3xl shadow-2xl p-6 relative">
            <button onClick={() => setItemToDelete(null)} className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface"><X className="w-5 h-5"/></button>
            
            <div className="flex flex-col items-center text-center mb-5 mt-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-error/10 text-error mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-on-surface">Delete Secret</h2>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                To permanently delete <strong>{itemToDelete.title}</strong>, please verify your {itemToDelete.isCustomPassword ? 'custom' : 'vault'} password.
              </p>
            </div>

            <form onSubmit={handleDelete} className="space-y-4" method="POST">
              {deleteError && <div className="text-xs text-error bg-error/10 p-2 rounded-lg leading-tight">{deleteError}</div>}
              <div>
                <input 
                  autoFocus 
                  required 
                  type="password" 
                  placeholder={itemToDelete.isCustomPassword ? "Enter Custom Password" : "Enter Vault Password"} 
                  disabled={loading} 
                  value={deletePasswordInput} 
                  onChange={e => setDeletePasswordInput(e.target.value)} 
                  className="w-full px-4 py-3 bg-surface-container-low border border-error/30 rounded-xl text-sm focus:border-error focus:outline-none disabled:opacity-50" 
                />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-error text-error-on font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-colors text-white">
                {loading ? "Verifying..." : "Verify & Delete"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}













