from flask import Blueprint
from flask import request
from flask import jsonify

from app.ai.core.router import ai_router


ai_bp = Blueprint(

    "ai",

    __name__

)


@ai_bp.route(

    "/chat",

    methods=["POST"]

)

def chat():

    data = request.json

    patient_context = data.get(

        "patient_context",

        {}

    )

    message = data.get(

        "message",

        ""

    )

    result = ai_router.route(

        patient_context,

        message

    )

    return jsonify(result)