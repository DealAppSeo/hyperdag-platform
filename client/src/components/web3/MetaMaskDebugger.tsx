import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MetaMaskDebuggerProps {
  onConnect?: (address: string, chainId: string, walletType: string) => void;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function MetaMaskDebugger({ onConnect }: MetaMaskDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Not Connected');
  const { toast } = useToast();

  useEffect(() => {
    performDebugCheck();
  }, []);

  const performDebugCheck = () => {
    const info: any = {
      timestamp: new Date().toLocaleTimeString(),
      windowEthereum: typeof window.ethereum !== 'undefined',
      isMetaMask: window.ethereum?.isMetaMask || false,
      providerDetected: !!window.ethereum,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      networkOnline: navigator.onLine,
    };

    if (window.ethereum) {
      info.ethereumVersion = window.ethereum.version || 'Unknown';
      info.selectedAddress = window.ethereum.selectedAddress;
      info.chainId = window.ethereum.chainId;
      info.networkVersion = window.ethereum.networkVersion;
      info.isConnected = window.ethereum.isConnected?.() || false;
      info.methods = Object.getOwnPropertyNames(window.ethereum).filter(prop => 
        typeof window.ethereum[prop] === 'function'
      );
    }

    console.log('MetaMask Debug Info:', info);
    setDebugInfo(info);
  };

  const testBasicConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus('Checking MetaMask...');
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not detected');
      }

      setConnectionStatus('MetaMask detected, requesting accounts...');
      
      // Test if we can call eth_accounts (doesn't require user permission)
      const existingAccounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      console.log('Existing accounts:', existingAccounts);
      
      if (existingAccounts.length > 0) {
        setConnectionStatus('Already connected');
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (onConnect) {
          onConnect(existingAccounts[0], chainId, 'MetaMask');
        }
        
        toast({
          title: 'Already Connected',
          description: `Connected to ${existingAccounts[0].slice(0, 6)}...${existingAccounts[0].slice(-4)}`,
        });
        
        return;
      }

      setConnectionStatus('Requesting permission...');
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log('New connection accounts:', accounts);

      if (accounts.length > 0) {
        setConnectionStatus('Connected successfully');
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (onConnect) {
          onConnect(accounts[0], chainId, 'MetaMask');
        }

        toast({
          title: 'Connection Successful',
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      } else {
        throw new Error('No accounts returned');
      }

    } catch (error: any) {
      console.error('Connection test failed:', error);
      
      let errorMessage = 'Connection failed';
      
      if (error.code === 4001) {
        errorMessage = 'User rejected the connection request';
        setConnectionStatus('User rejected connection');
      } else if (error.code === -32002) {
        errorMessage = 'Connection request already pending. Please check MetaMask.';
        setConnectionStatus('Request pending in MetaMask');
      } else if (error.message) {
        errorMessage = error.message;
        setConnectionStatus(`Error: ${error.message}`);
      }

      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
      performDebugCheck();
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Connected') || status.includes('success')) return 'bg-green-100 text-green-800';
    if (status.includes('Error') || status.includes('failed') || status.includes('rejected')) return 'bg-red-100 text-red-800';
    if (status.includes('pending') || status.includes('Requesting')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            MetaMask Connection Debugger
          </CardTitle>
          <CardDescription>
            Comprehensive testing and debugging for MetaMask connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge className={getStatusColor(connectionStatus)}>
              {connectionStatus}
            </Badge>
            <Button
              onClick={performDebugCheck}
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>

          <Button 
            onClick={testBasicConnection}
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Test MetaMask Connection
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {debugInfo.windowEthereum ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>window.ethereum detected</span>
              </div>
              
              <div className="flex items-center gap-2">
                {debugInfo.isMetaMask ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>MetaMask provider</span>
              </div>
              
              <div className="flex items-center gap-2">
                {debugInfo.networkOnline ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Network online</span>
              </div>
              
              <div className="flex items-center gap-2">
                {debugInfo.isConnected ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <span>Provider connected</span>
              </div>
            </div>

            {debugInfo.selectedAddress && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-1">Current Address:</p>
                <p className="text-xs font-mono text-green-700">{debugInfo.selectedAddress}</p>
              </div>
            )}

            {debugInfo.chainId && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Chain ID:</p>
                <p className="text-xs font-mono text-blue-700">{debugInfo.chainId}</p>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>

      {!debugInfo.windowEthereum && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            MetaMask is not detected. Please install MetaMask browser extension and refresh the page.
            <div className="mt-2">
              <Button 
                onClick={() => window.open('https://metamask.io/download/', '_blank')}
                variant="outline"
                size="sm"
              >
                Install MetaMask
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}