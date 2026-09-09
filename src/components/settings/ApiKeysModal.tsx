import React, { useState } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Server,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react'
import type { ApiKeysState, ProviderId } from '../../types/ai'
import { getAllProviders, getProviderConfig } from '../../services/ai/models'
import { testProviderConnection } from '../../services/ai/client'

interface ApiKeysModalProps {
  isOpen: boolean
  onClose: () => void
  keys: ApiKeysState
  onSaveKeys: (newKeys: ApiKeysState) => void
  activeProvider: ProviderId
  onSelectProvider: (provider: ProviderId) => void
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({
  isOpen,
  onClose,
  keys,
  onSaveKeys,
  activeProvider,
  onSelectProvider,
}) => {
  const [localKeys, setLocalKeys] = useState<ApiKeysState>(keys)
  const [selectedTab, setSelectedTab] = useState<ProviderId>(activeProvider)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [testingStatus, setTestingStatus] = useState<
    Record<string, { loading: boolean; ok?: boolean; message?: string }>
  >({})

  if (!isOpen) return null

  const providers = getAllProviders()
  const currentProviderConfig = getProviderConfig(selectedTab)

  const handleKeyChange = (providerId: ProviderId, value: string) => {
    setLocalKeys((prev) => ({
      ...prev,
      [providerId]: value.trim(),
    }))
  }

  const handleBaseUrlChange = (url: string) => {
    setLocalKeys((prev) => ({
      ...prev,
      opencodeBaseUrl: url.trim(),
    }))
  }

  const toggleShowPassword = (key: string) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleTestConnection = async (providerId: ProviderId) => {
    setTestingStatus((prev) => ({
      ...prev,
      [providerId]: { loading: true },
    }))

    const result = await testProviderConnection(providerId, localKeys)

    setTestingStatus((prev) => ({
      ...prev,
      [providerId]: {
        loading: false,
        ok: result.ok,
        message: result.message,
      },
    }))
  }

  const handleSave = () => {
    onSaveKeys(localKeys)
    onSelectProvider(selectedTab)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <KeyRound size={20} />
            </div>
            <div>
              <h3>Gestion des Clés d'API & Fournisseurs</h3>
              <p className="modal-subtitle">
                Configure tes accès pour Gemini, Mistral, OpenAI, Anthropic, OpenRouter et OpenCode
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon-close">
            <X size={20} />
          </button>
        </div>

        {/* Local storage privacy alert */}
        <div className="privacy-banner">
          <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
          <span>
            <strong>Sécurité garantie :</strong> Tes clés sont stockées uniquement dans la mémoire
            locale de ton navigateur (localStorage). Aucun serveur intermédiaire n'y a accès.
          </span>
        </div>

        {/* Content with Provider Tabs */}
        <div className="modal-body">
          {/* Provider Tabs */}
          <div className="provider-tabs-bar">
            {providers.map((p) => {
              const hasKey = !!localKeys[p.id]
              const isCurrent = selectedTab === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedTab(p.id)}
                  className={`provider-tab-btn ${isCurrent ? 'active' : ''}`}
                >
                  <span className="font-medium">{p.name}</span>
                  {hasKey && <span className="key-configured-dot" title="Clé configurée" />}
                </button>
              )
            })}
          </div>

          {/* Current Provider Panel */}
          <div className="provider-panel">
            <div className="provider-panel-header">
              <div>
                <h4 className="provider-name-heading">{currentProviderConfig.name}</h4>
                <p className="provider-description">{currentProviderConfig.helpText}</p>
              </div>
              <a
                href={currentProviderConfig.getKeyUrl}
                target="_blank"
                rel="noreferrer"
                className="get-key-link"
              >
                <span>Obtenir une clé</span>
                <ExternalLink size={14} />
              </a>
            </div>

            {/* API Key Input */}
            <div className="form-group">
              <label className="form-label">
                Clé d'API {currentProviderConfig.name}
              </label>
              <div className="input-password-wrap">
                <input
                  type={showPassword[selectedTab] ? 'text' : 'password'}
                  value={localKeys[selectedTab] || ''}
                  onChange={(e) => handleKeyChange(selectedTab, e.target.value)}
                  placeholder={currentProviderConfig.placeholderKey}
                  className="input-api-key"
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword(selectedTab)}
                  className="btn-toggle-eye"
                  title={showPassword[selectedTab] ? 'Masquer' : 'Afficher'}
                >
                  {showPassword[selectedTab] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* OpenCode / Custom endpoint specific fields */}
            {currentProviderConfig.allowCustomBaseUrl && (
              <div className="form-group">
                <label className="form-label">
                  <Server size={14} className="inline mr-1" />
                  URL du serveur OpenCode (Ollama, LM Studio, vLLM, etc.)
                </label>
                <input
                  type="text"
                  value={localKeys.opencodeBaseUrl || 'http://localhost:11434/v1'}
                  onChange={(e) => handleBaseUrlChange(e.target.value)}
                  placeholder="http://localhost:11434/v1 ou http://localhost:8000/v1"
                  className="input-api-key"
                />
                <p className="field-hint">
                  Par défaut pour Ollama local (http://localhost:11434/v1). Modifiable pour tout serveur OpenAI-compatible.
                </p>
              </div>
            )}

            {/* Models list preview */}
            <div className="models-catalog-preview">
              <span className="models-catalog-title">
                Modèles inclus ({currentProviderConfig.models.length}) :
              </span>
              <div className="models-badge-list">
                {currentProviderConfig.models.map((m) => (
                  <span key={m.id} className="model-chip" title={m.description}>
                    <strong>{m.name}</strong>
                    {m.badge && <span className="chip-badge">{m.badge}</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Test Connection Button & Status */}
            <div className="test-connection-section">
              <button
                type="button"
                onClick={() => handleTestConnection(selectedTab)}
                disabled={testingStatus[selectedTab]?.loading}
                className="btn-test-connection"
              >
                {testingStatus[selectedTab]?.loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Vérification en cours...</span>
                  </>
                ) : (
                  <span>Tester la connexion</span>
                )}
              </button>

              {testingStatus[selectedTab]?.ok !== undefined && (
                <div
                  className={`test-result-alert ${
                    testingStatus[selectedTab]?.ok ? 'success' : 'error'
                  }`}
                >
                  {testingStatus[selectedTab]?.ok ? (
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle size={18} className="shrink-0 text-rose-500" />
                  )}
                  <span>{testingStatus[selectedTab]?.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-cancel">
            Annuler
          </button>
          <button type="button" onClick={handleSave} className="btn-save-keys">
            Enregistrer & Utiliser
          </button>
        </div>
      </div>
    </div>
  )
}
