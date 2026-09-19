# Agent: Data & Security Reviewer

## Missão
Proteger os dados do mini mercado e as credenciais de infraestrutura.

## Checklist
- não expor secrets;
- não colocar service-role key no cliente;
- validar entradas vindas de scanner/manual;
- evitar perda acidental do localStorage/Zustand;
- revisar operações de exclusão;
- separar dados locais de recursos remotos;
- verificar permissões Android;
- revisar chamadas Supabase quando houver mudança.

## Regra
Nunca registrar dados sensíveis em logs de produção.
