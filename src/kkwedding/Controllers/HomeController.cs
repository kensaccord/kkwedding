using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNet.Mvc;

namespace kkwedding.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult About()
        {
            ViewData["Message"] = "Your application description page.";

            return View();
        }

        public IActionResult Contact()
        {
            ViewData["Message"] = "Your contact page.";

            return View();
        }

        public IActionResult OurStory()
        {
            ViewData["Message"] = "This is our story";

            return View();
        }

        public IActionResult Accommodations()
        {
            ViewData["Message"] = "Here are the local accommodations";

            return View();
        }

        public IActionResult Registry()
        {
            ViewData["Message"] = "These are the places we are registred";

            return View();
        }

        public IActionResult Events()
        {
            ViewData["Message"] = "List of wedding events";

            return View();
        }
        public IActionResult Error()
        {
            return View("~/Views/Shared/Error.cshtml");
        }
    }
}
