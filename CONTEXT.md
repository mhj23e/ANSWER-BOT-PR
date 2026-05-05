# Current Project

## What we are building
The RAG BOT is a production-grade research assistant designed to implement a seven-layer RAG architecture that bridges the gap between simple demos and robust, enterprise-ready systems
. It utilizes a "search-foundation-first" approach, combining hybrid search (BM25 and vector retrieval), intelligent chunking, and mandatory permission filtering to ensure high retrieval accuracy and data security
. The final system integrates agentic reasoning via LangGraph, LLM support for privacy, and comprehensive observability tools like Langfuse and Redis for cost and performance optimization
.

## What good looks like
A successful output of this project is a production-grade AI research assistant (the RAG BOT) that moves beyond a simple "demo" to a robust, seven-layer architecture
. 

1. Functional Research Capabilities
The system successfully automates the ingestion and parsing of academic papers from arXiv, allowing users to ask complex research questions and receive intelligent, context-aware answers
. The final response must cite the specific resources used in its generation to ensure transparency and trust
.
2. Advanced User Interfaces
The project provides two primary ways to interact with the RAG (Retrieval-Augmented Generation) system:
Gradio Web Interface: A user-friendly chat interface that supports streaming responses (Server-Sent Events) for real-time interaction
.
Telegram Bot: A mobile-first conversational AI that allows users to access the agentic RAG system from any device
.
3. Agentic Intelligence and Reliability
Unlike basic RAG systems that fail 40% of the time, a successful project output uses LangGraph to perform intelligent reasoning
. This includes:
Adaptive Retrieval: The agent can evaluate retrieved documents and rewrite the query if the initial results are insufficient
.
Document Grading: It automatically assesses the relevance of chunks before sending them to the LLM
.
Guardrails: It detects out-of-domain queries to prevent hallucinations and ensure the system stays within its research boundaries
.
4. Production-Ready Performance Metrics
A successful output is defined by three key operational outcomes:
High Accuracy: By using hybrid search (keyword + semantic) and a re-ranking layer, the system provides a significant precision boost over standard vector-only retrieval
.
Zero Data Leakage: Through a dedicated permission filtering layer, the system ensures that users can only access documents they are authorized to see, preventing unauthorized data exposure
.
Cost and Speed Optimization: The system is cost-efficient, potentially saving thousands of dollars monthly by using re-ranking to send only the top 3 high-precision chunks to the LLM instead of a larger, more expensive context
.
5. Comprehensive Observability
Finally, a successful project includes a full suite of monitoring tools. This includes an Airflow dashboard for managing data workflows, OpenSearch Dashboards for search engine UI, and a Langfuse dashboard for real-time tracing of the RAG pipeline's latency and costs
.

Finally, a successful project includes a full suite of monitoring tools. This includes an Airflow dashboard for managing data workflows, OpenSearch Dashboards for search engine UI, and a Langfuse dashboard for real-time tracing of the RAG pipeline's latency and costs
.

## What to avoid
Common mistakes in building RAG systems often stem from treating a "demo" setup as a production-ready architecture, leading to poor accuracy, security risks, and high costs.
1. Architectural Mistakes: The "Demo" Trap
Building a 3-Layer System Instead of 7: Most teams only implement document embedding, storage, and retrieval/generation
. This "demo" architecture typically fails in production because it misses critical layers like document processing, re-ranking, and permission filtering
.
Ignoring Search Fundamentals: A common error is taking an "AI-first" approach that ignores basic search foundations
. Successful systems implement BM25 keyword search as a baseline before adding semantic vector layers
.
Choosing Tools for the Wrong Reasons: Developers often ask which database is "best" rather than evaluating their specific access patterns, scale requirements, and DevOps expertise
.
2. Retrieval and Accuracy Errors
Fixed-Size Chunking Without Overlap: Using fixed chunks without overlap leads to context loss at boundaries
. When related information is split across chunks, the system retrieves incomplete data, resulting in poor accuracy
.
Relying Solely on Vector Search: Standard vector retrieval often misses the correct documents 40% of the time
. Failing to use hybrid search (combining keywords and vectors) and re-ranking prevents the system from achieving the "precision boost" needed for production
.
Lack of Agentic Reasoning: Without document grading and query rewriting, a system cannot adapt when initial retrieval results are insufficient, leading to unreliable answers
.
3. Security and Safety Risks (Outcomes to Avoid)
Data Leakage: This occurs when a system lacks a permission filtering layer
. Without it, the vector database will "happily retrieve" confidential information, such as executive memos, for unauthorized users
.
Hallucination via Out-of-Domain Queries: Without guardrails to detect queries outside the system's intended scope (e.g., asking a research assistant for medical advice), the LLM is more likely to hallucinate or provide irrelevant information
.
4. Financial and Operational Failures
Exploding LLM Costs: A major mistake is focusing on the cost of the vector database, which usually accounts for less than 1% of the budget
. The real expense is LLM context tokens (99% of costs)
.
Sending Too Many Chunks to the LLM: Sending a high "Top-K" count (e.g., top 5 or 10 chunks) directly to the LLM without re-ranking can cost thousands of dollars more per month than necessary
.
Lack of Caching and Monitoring: Failing to implement Redis caching for common queries means paying for redundant embeddings and LLM calls, significantly slowing down the system and increasing overhead
.