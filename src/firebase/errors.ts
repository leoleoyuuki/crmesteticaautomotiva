export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
    requestResourceData?: any;
  };
  
  export class FirestorePermissionError extends Error {
    public readonly context: SecurityRuleContext;
  
    constructor(context: SecurityRuleContext) {
      const { path, operation } = context;
      const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n- Path: ${path}\n- Operation: ${operation}`;
      super(message);
      this.name = 'FirestorePermissionError';
      this.context = context;
  
      // This is to make the error visible in the Next.js error overlay
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          throw this;
        }, 0);
      }
    }
  }
  