import { useEffect, useState } from 'react';
import { ApiError, client } from '../api/client';
import { checkoutUrl, getMe } from '../api/account';
import type { Me } from '../api/account';
import type { ModelList, PauseReason, Provider } from '../api/types';
import { DEFAULT_PROVIDER, loadKey, saveKey } from '../game/apiKey';
import { rememberLabels } from '../game/labels';
import { currentLanguage, t } from '../i18n';
import { KeyCheckRow, ModelOptions, useKeyCheck } from './KeyCheck';
import { TopUps, UsageMeter } from './Usage';

interface Props {
  sessionId: string;
  reason: PauseReason;
  /** The manager's model so far; kept when the key's provider offers it. */
  model: string;
}

/**
 * The shift is waiting: the free shift or the account's usage is used up, or the player's key stopped
 * working. They can top up and go on (usage), add a key and go on from where it stopped, or end the
 * shift and get the review.
 */
export function KeyPause({ sessionId, reason, model: current }: Props) {
  const saved = loadKey();
  const [provider, setProvider] = useState<Provider>(saved?.provider ?? DEFAULT_PROVIDER);
  const [apiKey, setApiKey] = useState(reason === 'allowance' || reason === 'usage' ? (saved?.apiKey ?? '') : '');
  const [remember, setRemember] = useState(!!saved);
  const [models, setModels] = useState<ModelList | null>(null);
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState<'continue' | 'finish' | 'topUp' | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** At the usage limit the choices come first; the key form only once the player asks for it. */
  const [withKey, setWithKey] = useState(reason !== 'usage');
  const [me, setMe] = useState<Me | null>(null);
  /** A checkout was opened in another tab: its top-up is waited for. */
  const [opened, setOpened] = useState(false);
  // While paused at the usage limit, a top-up made in another tab shows up here.
  useEffect(() => {
    if (reason !== 'usage') return;
    let live = true;
    const load = () =>
      getMe()
        .then((m) => live && setMe(m))
        .catch(() => {});
    void load();
    const timer = setInterval(load, 5000);
    window.addEventListener('focus', load);
    return () => {
      live = false;
      clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, [reason]);
  const usage = me?.account?.usage;
  const back = !!usage && usage.left > 0;

  useEffect(() => {
    let live = true;
    setModels(null);
    client
      .getModels(provider)
      .then((m) => {
        if (!live) return;
        rememberLabels(m.models);
        setModels(m);
        setModel((cur) => [cur, current].find((id) => m.models.some((x) => x.id === id)) ?? m.default);
      })
      .catch(() => live && setError(t('start.offline')));
    return () => {
      live = false;
    };
  }, [provider, current]);
  const keyInfo = models?.providers.find((p) => p.id === provider);
  const keyCheck = useKeyCheck(provider, apiKey);
  const checked = keyCheck.models;
  // A checked key offers everything it can use; the manager so far stays picked when it is there.
  useEffect(() => {
    if (!checked) return;
    setModel((cur) => [cur, current].find((id) => checked.some((x) => x.id === id)) ?? checked[0].id);
  }, [checked, current]);
  useEffect(() => {
    if (checked || !models) return;
    setModel((cur) => [cur, current].find((id) => models.models.some((x) => x.id === id)) ?? models.default);
  }, [checked, models, current]);

  const fail = (err: unknown) => {
    setError(err instanceof ApiError && err.status >= 400 && err.status < 500 ? err.message : t('pause.failed'));
    setBusy(null);
  };

  const go = async () => {
    if (busy) return;
    const key = apiKey.trim();
    if (!key) {
      setError(t('start.pasteKey'));
      return;
    }
    setBusy('continue');
    setError(null);
    try {
      await client.continueShift(sessionId, { provider, apiKey: key, model });
      saveKey(remember ? { provider, apiKey: key } : null);
    } catch (err) {
      fail(err);
    }
  };

  const topUp = async (amount: number) => {
    if (busy) return;
    // Opened on the click itself so it is not blocked; the shift stays on this page.
    const tab = window.open('', '_blank');
    setBusy('topUp');
    setError(null);
    try {
      const url = await checkoutUrl(currentLanguage(), amount);
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else window.open(url, '_blank', 'noopener');
      setOpened(true);
      setBusy(null);
    } catch (err) {
      tab?.close();
      fail(err);
    }
  };

  const resume = async () => {
    if (busy) return;
    setBusy('continue');
    setError(null);
    try {
      await client.resumeShift(sessionId);
    } catch (err) {
      fail(err);
    }
  };

  const finish = async () => {
    if (busy) return;
    setBusy('finish');
    setError(null);
    try {
      await client.finishShift(sessionId);
    } catch (err) {
      fail(err);
    }
  };

  if (!withKey) {
    const sourceUrl = models?.sourceUrl;
    return (
      <section className="pause" aria-labelledby="pause-title">
        <div className="pause-kicker">
          <span className="order-no">{t('pause.kicker')}</span>
        </div>
        <h2 className="pause-title" id="pause-title">
          {t('limit.title')}
        </h2>
        <p className="pause-text">{back ? t('pause.usage.back') : t('limit.body')}</p>
        {usage && <UsageMeter usage={usage} className="pause-usage" />}
        {!back && <TopUps amounts={me?.topUps ?? []} busy={busy !== null} onTopUp={(a) => void topUp(a)} />}
        {!back && opened && <p className="usage-note">{t('pause.usage.waiting')}</p>}
        <div className="pause-actions pause-choices">
          {back && (
            <button type="button" className="btn btn-ink" onClick={() => void resume()} disabled={busy !== null}>
              {busy === 'continue' ? t('pause.continuing') : t('pause.continue')}
            </button>
          )}
          <button type="button" className="btn" onClick={() => setWithKey(true)} disabled={busy !== null}>
            {t('offer.ownKey')}
          </button>
          {sourceUrl && (
            <a className="btn" href={`${sourceUrl}#run-it`} target="_blank" rel="noreferrer">
              {t('offer.selfHost')}
            </a>
          )}
          <button type="button" className="btn" onClick={() => void finish()} disabled={busy !== null}>
            {busy === 'finish' ? t('pause.ending') : t('pause.finish')}
          </button>
        </div>
        {error && <p className="form-error pause-error">{error}</p>}
      </section>
    );
  }

  return (
    <section className="pause" aria-labelledby="pause-title">
      <div className="pause-kicker">
        <span className="order-no">{t('pause.kicker')}</span>
      </div>
      <h2 className="pause-title" id="pause-title">
        {t(
          reason === 'allowance'
            ? 'pause.allowance.title'
            : reason === 'usage'
              ? 'limit.title'
              : reason === 'key'
                ? 'pause.key.title'
                : 'pause.credit.title',
        )}
      </h2>
      <p className="pause-text">{t(reason === 'allowance' || reason === 'usage' ? 'pause.allowance.body' : 'pause.key.body')}</p>
      <form
        className="pause-form"
        onSubmit={(e) => {
          e.preventDefault();
          void go();
        }}
      >
        <label className="field">
          <span className="field-label">{t('start.provider')}</span>
          <select value={provider} onChange={(e) => setProvider(e.target.value as Provider)} className="select">
            {(models?.providers ?? [{ id: provider, label: provider }]).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">{t('start.manager')}</span>
          {models ? (
            <select value={model} onChange={(e) => setModel(e.target.value)} className="select">
              <ModelOptions models={checked ?? models.models} recommended={models.models} />
            </select>
          ) : (
            <span className="select select-placeholder">{t('start.assigning')}</span>
          )}
        </label>
        <div className="field pause-key">
          <span className="field-label">
            <label htmlFor="pause-key">{t('start.apiKey')}</label>
            {keyInfo && (
              <>
                {' · '}
                <a href={keyInfo.keyUrl} target="_blank" rel="noreferrer">
                  {t('start.getKey')}
                </a>
              </>
            )}
          </span>
          <input
            id="pause-key"
            className="select"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoFocus
          />
        </div>
        <KeyCheckRow check={keyCheck} className="pause-check" />
        <label className="check pause-remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>{t('start.remember')}</span>
        </label>
        <div className="pause-actions">
          <button type="submit" className="btn btn-ink" disabled={!models || busy !== null}>
            {busy === 'continue' ? t('pause.continuing') : t('pause.continue')}
          </button>
          <button type="button" className="btn" onClick={() => void finish()} disabled={busy !== null}>
            {busy === 'finish' ? t('pause.ending') : t('pause.finish')}
          </button>
        </div>
        {error && <p className="form-error pause-error">{error}</p>}
      </form>
    </section>
  );
}
