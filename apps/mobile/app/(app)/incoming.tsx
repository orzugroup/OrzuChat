import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { useCall } from '@/providers/CallProvider';

/** Deep link from the native full-screen incoming Activity: orzuchat://incoming?... */
export default function IncomingLinkScreen() {
  const params = useLocalSearchParams<{
    call_id?: string;
    kind?: string;
    caller_id?: string;
    action?: string;
  }>();
  const { openIncomingFromPush } = useCall();

  useEffect(() => {
    if (!params.call_id) return;
    void openIncomingFromPush(
      {
        type: 'incoming_call',
        call_id: params.call_id,
        kind: params.kind === 'audio' ? 'audio' : 'video',
        caller_id: params.caller_id,
      },
      params.action === 'decline' ? 'decline' : params.action === 'accept' ? 'accept' : 'open',
    );
  }, [openIncomingFromPush, params.action, params.call_id, params.caller_id, params.kind]);

  return <Redirect href="/" />;
}
