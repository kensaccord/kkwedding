using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace kkwedding.Models.Helpers
{
    public class HomeHelper
    {
        
        public string GetCountDown()
        {
            //Get these values however you like.
            DateTime daysLeft = DateTime.Parse("5/27/2016 12:00:01 AM");
            DateTime startDate = DateTime.Now;

            //Calculate countdown timer.
            TimeSpan t = daysLeft - startDate;
            return string.Format("{0} Days til I do.", t.Days );
        }

    }
}
