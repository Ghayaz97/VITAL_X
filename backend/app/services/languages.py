"""
Extensible Language Registry Service.
Supports BCP-47 language mappings for speech recognition, normalization, and audio prompts.
"""

from typing import Dict, Any, Optional

LANGUAGE_REGISTRY: Dict[str, Dict[str, Any]] = {
    "kn-IN": {
        "code": "kn-IN",
        "name": "ಕನ್ನಡ (Kannada)",
        "speech_locale": "kn-IN",
        "audio_prompt_playback": True,
        "default_greeting": "ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ."
    },
    "hi-IN": {
        "code": "hi-IN",
        "name": "हिंदी (Hindi)",
        "speech_locale": "hi-IN",
        "audio_prompt_playback": True,
        "default_greeting": "आइए आपके स्वास्थ्य को समझें।"
    },
    "en-IN": {
        "code": "en-IN",
        "name": "English (India)",
        "speech_locale": "en-IN",
        "audio_prompt_playback": True,
        "default_greeting": "Let's understand your health."
    }
}


def get_language_info(code: str) -> Dict[str, Any]:
    return LANGUAGE_REGISTRY.get(code, LANGUAGE_REGISTRY["en-IN"])


def register_language(code: str, name: str, speech_locale: str, default_greeting: str) -> None:
    LANGUAGE_REGISTRY[code] = {
        "code": code,
        "name": name,
        "speech_locale": speech_locale,
        "audio_prompt_playback": True,
        "default_greeting": default_greeting
    }
