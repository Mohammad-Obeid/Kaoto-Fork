import {
  FunctionComponent,
  PropsWithChildren,
  createContext,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { EventNotifier } from '../utils';

interface ISourceCodeApi {
  /** Set the Source Code and notify subscribers */
  setCodeAndNotify: (sourceCode: string, path?: string) => void;
}

interface SourceCodeProviderProps extends PropsWithChildren {
  /** The initial source code */
  initialSourceCode?: string;
}

export const SourceCodeContext = createContext<string>('');
export const SourceCodeApiContext = createContext<ISourceCodeApi>({ setCodeAndNotify: () => {} });

export const SourceCodeProvider: FunctionComponent<SourceCodeProviderProps> = ({
  initialSourceCode = '',
  children,
}) => {
  const eventNotifier = EventNotifier.getInstance();
  const [sourceCode, setSourceCode] = useState<string>(initialSourceCode);

  // Initialize sourceCode from localStorage on mount
  useLayoutEffect(() => {
    const savedCode = localStorage.getItem('sourceCode');
    if (savedCode && savedCode !== sourceCode) {
      setSourceCode(savedCode);
    }
  }, []); // run once on mount

  // Subscribe to 'entities:updated' events
  useLayoutEffect(() => {
    return eventNotifier.subscribe('entities:updated', (code) => {
      setSourceCode(code);
    });
  }, [eventNotifier]);

  // Handle code updates and notify subscribers + sync localStorage
  const setCodeAndNotify = useCallback(
    (code: string, path?: string) => {
      setSourceCode(code);
      eventNotifier.next('code:updated', { code, path });
      localStorage.setItem('sourceCode', code);
    },
    [eventNotifier],
  );

  // Listen for postMessage from Site 1 to receive YAML and metadata
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      let expectedOrigin = '';
      try {
        expectedOrigin = window.opener?.origin || '';
      } catch {
        expectedOrigin = '';
      }
      if (expectedOrigin && event.origin !== expectedOrigin) return;

      const { sourceCode: incomingCode, routeTitle, returnUrl } = event.data || {};
      if (incomingCode) {
        setSourceCode(incomingCode);
        localStorage.setItem('sourceCode', incomingCode);
        if (routeTitle) localStorage.setItem('kaoto_route_title', routeTitle);
        if (returnUrl) localStorage.setItem('kaoto_return_url', returnUrl);
      }
    }

    window.addEventListener('message', handleMessage);

    if (window.opener) {
      // If you know Site 1 origin, you can send here instead of '*'
      window.opener.postMessage('KaotoReady', '*');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const sourceCodeApi: ISourceCodeApi = useMemo(
    () => ({
      setCodeAndNotify,
    }),
    [setCodeAndNotify],
  );

  return (
    <SourceCodeApiContext.Provider value={sourceCodeApi}>
      <SourceCodeContext.Provider value={sourceCode}>{children}</SourceCodeContext.Provider>
    </SourceCodeApiContext.Provider>
  );
};
