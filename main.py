from datetime import datetime, timezone
from typing import Optional, List

import uvicorn
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, constr

app = FastAPI()

# CORS: allow local React dev servers to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _serialize_doc(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "date": doc.get("date"),
        "description": doc.get("description"),
        "category": doc.get("category"),
    }


def insert_document(name: str, description: str, date: datetime | None = None, category: str | None = None):
    if date is None:
        date = datetime.now(timezone.utc)

    with MongoClient("mongodb://localhost:27017/") as client:
        db = client.pactdb
        collection = db.pact

        document = {
            "name": name,
            "date": date,
            "description": description,
        }
        if category is not None and category != "":
            document["category"] = category

        # Fixed: insert_one
        result = collection.insert_one(document)
        print(f"Inserted document ID: {result.inserted_id}")
        return result.inserted_id


def get_document_by_id(document_id: str) -> Optional[dict]:
    try:
        oid = ObjectId(document_id)
    except (InvalidId, TypeError):
        return None

    with MongoClient("mongodb://localhost:27017/") as client:
        db = client.pactdb
        collection = db.pact
        doc = collection.find_one({"_id": oid})
        return _serialize_doc(doc) if doc else None


def query_documents(
        name: Optional[str] = None,
        category: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 50,
        skip: int = 0,
        sort_desc: bool = True,
) -> List[dict]:
    query: dict = {}

    if name:
        query["name"] = {"$regex": name, "$options": "i"}  # case-insensitive partial match

    if category is not None and category != "":
        # Exact match on category; keep case-sensitive by default, or make case-insensitive if needed
        query["category"] = category

    if start_date or end_date:
        date_range: dict = {}
        if start_date:
            date_range["$gte"] = start_date
        if end_date:
            date_range["$lte"] = end_date
        query["date"] = date_range

    with MongoClient("mongodb://localhost:27017/") as client:
        db = client.pactdb
        collection = db.pact

        cursor = (
            collection.find(query)
            .skip(skip)
            .limit(limit)
            .sort("date", -1 if sort_desc else 1)
        )
        return [_serialize_doc(d) for d in cursor]


@app.get("/pacts/{document_id}")
def api_get_document(document_id: str):
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@app.get("/pacts")
def api_query_documents(
        name: Optional[str] = Query(None, description="Partial match on name (case-insensitive)"),
        category: Optional[str] = Query(None, description="Exact match on category"),
        start_date: Optional[datetime] = Query(None, description="ISO8601 start date"),
        end_date: Optional[datetime] = Query(None, description="ISO8601 end date"),
        limit: int = Query(50, ge=1, le=500),
        skip: int = Query(0, ge=0),
        sort: str = Query("desc", pattern="^(asc|desc)$"),
):
    sort_desc = sort == "desc"
    return query_documents(
        name=name,
        category=category,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        skip=skip,
        sort_desc=sort_desc,
    )


class PactCreate(BaseModel):
    name: str
    description: str
    date: Optional[datetime] = None
    category: constr(strip_whitespace=True, min_length=1)


class PactUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    category: Optional[str] = None


@app.post("/pacts", response_model=dict)
def api_create_document(pact: PactCreate):
    doc_id = insert_document(
        name=pact.name,
        description=pact.description,
        date=pact.date,
        category=pact.category,
    )
    return get_document_by_id(str(doc_id))


@app.put("/pacts/{document_id}", response_model=dict)
def api_update_document(document_id: str, pact: PactUpdate):
    # Validate ObjectId
    try:
        oid = ObjectId(document_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document id")

    set_fields: dict = {}
    unset_fields: dict = {}

    if pact.name is not None:
        set_fields["name"] = pact.name
    if pact.description is not None:
        set_fields["description"] = pact.description
    if pact.date is not None:
        set_fields["date"] = pact.date
    if pact.category is not None:
        # Allow clearing category by sending empty string
        if isinstance(pact.category, str) and pact.category.strip() == "":
            unset_fields["category"] = ""
        else:
            set_fields["category"] = pact.category

    if not set_fields and not unset_fields:
        # No changes requested; return current doc if exists
        doc = get_document_by_id(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return doc

    update_doc: dict = {}
    if set_fields:
        update_doc["$set"] = set_fields
    if unset_fields:
        update_doc["$unset"] = unset_fields

    with MongoClient("mongodb://localhost:27017/") as client:
        db = client.pactdb
        collection = db.pact
        result = collection.update_one({"_id": oid}, update_doc)
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")

    return get_document_by_id(document_id)


@app.delete("/pacts/{document_id}")
def api_delete_document(document_id: str):
    # Validate ObjectId
    try:
        oid = ObjectId(document_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document id")

    with MongoClient("mongodb://localhost:27017/") as client:
        db = client.pactdb
        collection = db.pact
        result = collection.delete_one({"_id": oid})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        return {"id": document_id, "deleted": True}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)