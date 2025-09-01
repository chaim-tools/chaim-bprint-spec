# chaim-bprint-spec

**Chaim Blueprint Specification (`.bprint`)**  
A lightweight, versioned schema format for defining application data structures that drive **code generation, validation, and governance**.

---

## Overview

The **Blueprint Spec** (`.bprint`) is the foundation of Chaim’s open-source developer tools.  
It provides a declarative way to define data schemas that can be:

- Translated into **strongly typed POJOs/DTOs** (Java today, Python/Node.js in the future).  
- Used by the **Chaim Client** to validate data shapes and enforce constraints at runtime.  
- Referenced by **Chaim CDK Constructs** to bind infrastructure resources (e.g., DynamoDB tables) to schemas.  
- Versioned automatically, with `chaim_version` tags for lineage and governance.

---

## Why `.bprint`?

Other schema formats (e.g., JSON Schema, Smithy) are powerful but often cloud-specific or verbose.  
Chaim’s `.bprint` spec is:

- **Cloud-agnostic** – works across AWS, Azure, GCP, or local databases.  
- **Developer-first** – simple syntax, easy to read/write in codebases.  
- **Shift-left friendly** – designed to integrate with IaC (e.g., AWS CDK) and CI/CD.  
- **Extensible** – supports privacy/security attributes to power future compliance workflows.

---

## Example

```yaml
version: 1
namespace: com.example.orders
name: Order
fields:
  - name: orderId
    type: string
    primary: true
    required: true
  - name: customerId
    type: string
    required: true
  - name: amount
    type: number
    required: true
  - name: status
    type: string
    enum: [PENDING, SHIPPED, DELIVERED]
    required: true
