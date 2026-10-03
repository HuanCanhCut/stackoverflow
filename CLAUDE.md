@AGENTS.md

## Code Commenting Rules

- All code must include clear and sufficient comments for important logic, workflows, business rules, algorithms, and non-obvious implementation decisions.

- Comments should explain **why the code exists, what a logical block does, and any important assumptions or constraints**, rather than simply repeating what the code already says.

- Prefer **block-level comments**. Add one concise comment above a logical group of related statements instead of commenting on every individual line.

- Do NOT add unnecessary line-by-line comments when the code is already self-explanatory.

Bad:

```ts
// Get user
const user = await getUser(id)

// Check user
if (!user) {
    // Return null
    return null
}

// Get orders
const orders = await getOrders(user.id)
```
