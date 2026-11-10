import unittest
from pathlib import Path


class NoteProviderTest(unittest.TestCase):
    def test_note_tools_use_requested_direct_provider(self):
        for name in ("ai-assist", "spell-check"):
            with self.subTest(function=name):
                source = (Path(__file__).parent / name / "index.ts").read_text()
                self.assertIn("gpt-6.1-terra", source)
                self.assertIn("https://api.openai.com/v1/chat/completions", source)
                self.assertIn("OPENAI_API_KEY", source)
                self.assertNotIn("LOVABLE_API_KEY", source)
                self.assertNotIn("ai.gateway.lovable.dev", source)
                self.assertNotIn("gpt-6.1-sol", source)


if __name__ == "__main__":
    unittest.main()