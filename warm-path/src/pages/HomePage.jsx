import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const intents = ["Internship", "Research", "Class Help", "Club", "Skill"];

export default function HomePage() {
   const [activeIntent, setActiveIntent] = useState(null);

   return (
      <Box
         sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            padding: 2,
         }}
      >
         <Box sx={{ maxWidth: 600, width: "100%" }}>
            {/* Title */}
            <Typography variant="h3" fontWeight="bold" gutterBottom>
               WarmPath
            </Typography>

            <Typography variant="h6" sx={{ mb: 1 }}>
               Find your way in through a warm connection.
            </Typography>

            <Typography variant="subtitle1" color="white" sx={{ mb: 4 }}>
               Discover paths through your network with context at every step.
            </Typography>

            {/* Intent selector */}
            <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
               What are you looking for?
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
               {intents.map((intent) => (
                  <Button
                     key={intent}
                     variant={
                        activeIntent === intent ? "contained" : "outlined"
                     }
                     onClick={() => setActiveIntent(intent)}
                     size="small"
                  >
                     {intent}
                  </Button>
               ))}
            </Stack>

            <Stack direction="row" gap={2}>
               <Button
                  variant="contained"
                  size="large"
                  component={Link}
                  to="/register"
               >
                  Get Started
               </Button>
               <Button
                  variant="outlined"
                  size="large"
                  component={Link}
                  to="/login"
               >
                  Log In
               </Button>
            </Stack>
         </Box>
      </Box>
   );
}
